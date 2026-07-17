const LINKS = [
  { label: "Email", href: "mailto:oskostya25@gmail.com" },
  { label: "GitHub", href: "https://github.com/batpepe" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/batpepe/" }
];

export default function Footer() {
  return (
    <footer id="contact" className="scroll-mt-8 border-t border-line/70">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="font-mono text-sm text-cyan mb-2">
          <span className="text-faint"># </span>contact
        </p>
        <h2 className="text-3xl font-bold tracking-tight">Get in touch</h2>
        <p className="mt-3 max-w-2xl text-sub">
          Questions about the platform, the code or working together - my inbox is open.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="glow-card rounded-md border border-line px-5 py-2.5 font-semibold text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="mt-14 border-t border-line/70 pt-6 font-mono text-xs text-faint">
          (c) 2026 Kostiantyn Osmakov · Next.js static export served by nginx on K3s · deploys: push
          -&gt; Actions -&gt; GHCR -&gt; ArgoCD
        </p>
      </div>
    </footer>
  );
}
