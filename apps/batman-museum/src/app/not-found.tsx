import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid h-dvh w-screen place-items-center bg-[var(--bg)] px-6">
      <div className="relative w-full max-w-md border border-[var(--line)] bg-[var(--panel)] p-8">
        <span className="hud-corner left-0 top-0 border-l-2 border-t-2" style={{ borderColor: "var(--danger)" }} />
        <span className="hud-corner right-0 top-0 border-r-2 border-t-2" style={{ borderColor: "var(--danger)" }} />
        <span className="hud-corner bottom-0 left-0 border-b-2 border-l-2" style={{ borderColor: "var(--danger)" }} />
        <span className="hud-corner bottom-0 right-0 border-b-2 border-r-2" style={{ borderColor: "var(--danger)" }} />
        <div className="scanlines pointer-events-none absolute inset-0" aria-hidden="true" />

        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--danger)]">
          batcomputer // query failed
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-[0.14em] text-[var(--text)]">
          FILE NOT FOUND
        </h1>
        <div className="mt-4 space-y-1 font-mono text-[11px] text-[var(--dim)]">
          <p>&gt; search /archive ... 0 records</p>
          <p>&gt; cross-reference aliases ... none</p>
          <p>&gt; conclusion: this wing does not exist</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="font-display border border-[var(--line)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--cyan)] transition-colors hover:border-[var(--cyan)]"
          >
            &lt;&lt; return to star map
          </Link>
          <Link
            href="/about"
            className="font-display border border-[var(--line)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--dim)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
          >
            about the museum
          </Link>
        </div>
      </div>
    </main>
  );
}
