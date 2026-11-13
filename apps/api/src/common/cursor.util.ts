// Opaque pagination cursor = base64 JSON of DynamoDB's own
// LastEvaluatedKey/ExclusiveStartKey. Clients never see table internals,
// just a string they pass back as `after`.

export function encodeCursor(
  key: Record<string, unknown> | undefined,
): string | undefined {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key), 'utf8').toString('base64');
}

export function decodeCursor(
  cursor: string | undefined,
): Record<string, unknown> | undefined {
  if (!cursor) return undefined;
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
}
