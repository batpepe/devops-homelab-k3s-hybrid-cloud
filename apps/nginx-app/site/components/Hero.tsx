import VisitCounter from "@/components/VisitCounter";

const REPO_URL = "https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud";

const NAV = [
  { href: "#platform", label: "platform" },
  { href: "#architecture", label: "architecture" },
  { href: "#live", label: "live" },
  { href: "#experience", label: "experience" },
  { href: "#contact", label: "contact" }
];

export default function Hero() {
  return (
    <header className="border-b border-surface0 bg-mantle">
      <div className="mx-auto max-w-5xl px-6">
        <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 font-mono text-sm">
          <span className="text-ink">
            kostiantyn<span className="text-overlay">@</span>
            <span className="text-blue">k3s</span>
            <span className="text-overlay">:~$</span>
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-sub hover:text-ink transition-colors">
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="py-20 sm:py-28">
          <p className="font-mono text-sm text-green mb-4">$ whoami</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance max-w-3xl">
            I build and run infrastructure the GitOps way.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-sub">
            I&apos;m Kostiantyn Osmakov, a junior DevOps engineer from Kyiv with an IT operations
            background. The page you are reading is served from my own K3s cluster: every deploy
            starts as a git push, gets built and scanned in CI, and lands here through ArgoCD -
            with zero open inbound ports at home.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-green px-5 py-2.5 font-semibold text-crust hover:bg-teal transition-colors"
            >
              View the source on GitHub
            </a>
            <a
              href="/CV_Kostiantyn_Osmakov.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-surface1 px-5 py-2.5 font-semibold text-ink hover:border-blue hover:text-blue transition-colors"
            >
              Download CV (PDF)
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-2 font-mono text-xs">
            <span className="rounded-full border border-surface0 bg-base px-3 py-1 text-sub">
              k3s <span className="text-overlay">·</span> self-hosted
            </span>
            <span className="rounded-full border border-surface0 bg-base px-3 py-1 text-sub">
              gitops <span className="text-overlay">·</span> argocd
            </span>
            <VisitCounter />
          </div>
        </div>
      </div>
    </header>
  );
}
