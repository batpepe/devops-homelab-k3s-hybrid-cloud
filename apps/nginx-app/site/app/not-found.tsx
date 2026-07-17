import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-start px-6 py-32">
      <p className="font-mono text-sm text-red">$ curl -I this-page</p>
      <h1 className="mt-4 text-5xl sm:text-7xl font-bold tracking-tight">
        <span className="grad-text">404</span>
      </h1>
      <p className="mt-4 max-w-md text-lg text-sub">
        No Ingress rule matches this path. The route was pruned, renamed, or never existed.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 font-mono text-sm">
        <Link href="/" className="glow-card rounded-md border border-line px-4 py-2 text-cyan">
          cd ~
        </Link>
        <Link href="/projects" className="glow-card rounded-md border border-line px-4 py-2 text-sub">
          ls projects/
        </Link>
      </div>
    </main>
  );
}
