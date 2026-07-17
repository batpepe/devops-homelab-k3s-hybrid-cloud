"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const REPO_URL = "https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud";

const LINKS = [
  { href: "/projects", label: "projects" },
  { href: "/stack", label: "stack" },
  { href: "/notes", label: "notes" },
  { href: "/status", label: "status" }
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 border-b border-line/70 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 font-mono text-sm">
        <Link href="/" className="text-ink hover:text-cyan transition-colors">
          kostiantyn<span className="text-faint">@</span>
          <span className="grad-text font-semibold">k3s</span>
          <span className="text-faint">:~$</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {LINKS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-cyan"
                    : "text-sub hover:text-ink transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line px-3 py-1 text-sub hover:border-blue hover:text-blue transition-colors"
          >
            github
          </a>
        </div>
      </div>
    </nav>
  );
}
