"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid h-dvh w-screen place-items-center bg-[var(--bg)] px-6">
      <div className="relative w-full max-w-md border border-[var(--line)] bg-[var(--panel)] p-8">
        <span className="hud-corner left-0 top-0 border-l-2 border-t-2" style={{ borderColor: "var(--danger)" }} />
        <span className="hud-corner right-0 top-0 border-r-2 border-t-2" style={{ borderColor: "var(--danger)" }} />
        <span className="hud-corner bottom-0 left-0 border-b-2 border-l-2" style={{ borderColor: "var(--danger)" }} />
        <span className="hud-corner bottom-0 right-0 border-b-2 border-r-2" style={{ borderColor: "var(--danger)" }} />
        <div className="scanlines pointer-events-none absolute inset-0" aria-hidden="true" />

        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--danger)]">
          batcomputer // system fault
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-[0.14em] text-[var(--text)]">
          ARCHIVE OFFLINE
        </h1>
        <div className="mt-4 space-y-1 font-mono text-[11px] text-[var(--dim)]">
          <p>&gt; unexpected exception in the exhibit subsystem</p>
          {error.digest ? <p>&gt; trace id: {error.digest}</p> : null}
          <p>&gt; recommended action: reboot the interface</p>
        </div>
        <button
          onClick={reset}
          className="font-display mt-6 border border-[var(--line)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--cyan)] transition-colors hover:border-[var(--cyan)]"
        >
          reboot [retry]
        </button>
      </div>
    </main>
  );
}
