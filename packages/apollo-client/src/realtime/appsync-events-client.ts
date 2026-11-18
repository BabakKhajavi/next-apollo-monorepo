/**
 * Browser client for AWS AppSync Events (not GraphQL subscriptions — the
 * backend's schema has no Subscription type; it pushes updates over a
 * separate pub/sub channel instead, published via packages/realtime's
 * `publishEvent` on the Lambda side). There's no published client library
 * for this specific protocol (AWS ships it inside the much heavier
 * `aws-amplify` package), so this re-implements the small wire protocol
 * directly — verified against the real deployed API, not guessed:
 *
 * - Auth travels in the WebSocket subprotocol list, not a query string:
 *   `new WebSocket(url, ["aws-appsync-event-ws", "header-<base64url>"])`,
 *   where the decoded header is `{ host, "x-amz-date", "x-api-key" }`.
 * - After the socket opens: send `{ type: "connection_init" }`, wait for
 *   `{ type: "connection_ack" }`.
 * - Subscribe: `{ id, channel, authorization: <same header shape>, type:
 *   "subscribe" }`, wait for `{ id, type: "subscribe_success" }`.
 * - Events arrive as `{ id, type: "data", event: "<json-encoded string>" }`.
 * - Unsubscribe: `{ id, type: "unsubscribe" }`.
 *
 * API_KEY auth only (matches the backend's AppSync Events API, which uses
 * API_KEY for demo simplicity) — swap for IAM/Cognito before production use.
 */

export interface AppSyncEventsClientConfig {
  /** e.g. https://xxxx.appsync-api.us-east-1.amazonaws.com */
  httpEndpoint: string;
  apiKey: string;
}

type EventHandler = (event: unknown) => void;

interface Subscription {
  channel: string;
  onEvent: EventHandler;
}

const MAX_RECONNECT_DELAY_MS = 30_000;

export class AppSyncEventsClient {
  private socket: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private subscriptions = new Map<string, Subscription>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closedByCaller = false;

  constructor(private readonly config: AppSyncEventsClientConfig) {}

  async subscribe(channel: string, onEvent: EventHandler): Promise<() => void> {
    const id = crypto.randomUUID();
    this.subscriptions.set(id, { channel, onEvent });

    await this.ensureConnected();
    this.sendSubscribe(id, channel);

    return () => {
      this.subscriptions.delete(id);
      this.socket?.send(JSON.stringify({ id, type: "unsubscribe" }));
      if (this.subscriptions.size === 0) this.close();
    };
  }

  close(): void {
    this.closedByCaller = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
    this.connectPromise = null;
  }

  private get realtimeUrl(): string {
    // https://xxx.appsync-api.region.amazonaws.com -> wss://xxx.appsync-realtime-api.region.amazonaws.com/event/realtime
    const realtimeHost = this.config.httpEndpoint
      .replace("https://", "")
      .replace("appsync-api", "appsync-realtime-api");
    return `wss://${realtimeHost}/event/realtime`;
  }

  private get httpHost(): string {
    return new URL(this.config.httpEndpoint).host;
  }

  private authHeader(): Record<string, string> {
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    return { host: this.httpHost, "x-amz-date": amzDate, "x-api-key": this.config.apiKey };
  }

  private base64url(value: string): string {
    return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  private ensureConnected(): Promise<void> {
    this.closedByCaller = false;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      const encodedHeader = this.base64url(JSON.stringify(this.authHeader()));
      const socket = new WebSocket(this.realtimeUrl, ["aws-appsync-event-ws", `header-${encodedHeader}`]);
      this.socket = socket;

      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ type: "connection_init" }));
      });

      socket.addEventListener("message", (message: MessageEvent<string>) => {
        const data = JSON.parse(message.data) as {
          type: string;
          id?: string;
          event?: string;
        };

        if (data.type === "connection_ack") {
          this.reconnectAttempt = 0;
          resolve();
          // Re-establish any subscriptions that existed before a reconnect.
          for (const [id, { channel }] of this.subscriptions) this.sendSubscribe(id, channel);
          return;
        }

        if (data.type === "data" && data.id && data.event) {
          const subscription = this.subscriptions.get(data.id);
          subscription?.onEvent(JSON.parse(data.event));
        }
      });

      socket.addEventListener("close", () => {
        this.socket = null;
        this.connectPromise = null;
        if (this.closedByCaller || this.subscriptions.size === 0) return;
        this.scheduleReconnect();
      });

      socket.addEventListener("error", () => {
        reject(new Error("AppSync Events connection failed"));
      });
    });

    return this.connectPromise;
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.ensureConnected().catch(() => this.scheduleReconnect());
    }, delay);
  }

  private sendSubscribe(id: string, channel: string): void {
    this.socket?.send(
      JSON.stringify({ id, channel, authorization: this.authHeader(), type: "subscribe" }),
    );
  }
}
