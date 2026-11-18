"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Workflows are unavailable</h1>
      <p className="mt-3 text-zinc-600">Check the API connection and try again.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-md bg-zinc-900 px-4 py-2 text-white">
        Try again
      </button>
    </main>
  );
}
