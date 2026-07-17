"use client";

import { useEffect, useState } from "react";

interface StatusData {
  status: string;
  version: string;
  uptime_s: number;
  db: { ok: boolean; latency_ms: number | null };
  services: Record<string, { ok: boolean }>;
}

const REPO_URL = "https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud";

const SERVICE_LINKS: Record<string, string> = {
  cv: "https://cv.batpepe.online",
  museum: "https://museum.batpepe.online",
  game: "https://game.batpepe.online"
};

function humanUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Dot({ state }: { state: "ok" | "err" | "unknown" }) {
  const cls = state === "ok" ? "dot dot-ok" : state === "err" ? "dot dot-err" : "dot";
  return <span className={cls} aria-hidden="true" />;
}

export default function StatusWidget() {
  const [data, setData] = useState<StatusData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/status")
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          setData(d);
          setFailed(false);
        })
        .catch(() => alive && setFailed(true));
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (failed) {
    return (
      <p className="font-mono text-sm text-sub">
        <Dot state="err" /> <span className="ml-2">API unreachable from this origin</span>
      </p>
    );
  }
  if (!data) {
    return <p className="font-mono text-sm text-faint">querying the cluster...</p>;
  }

  const rows: { label: string; state: "ok" | "err"; detail: string; href?: string }[] = [
    {
      label: "api",
      state: data.status === "ok" ? "ok" : "err",
      detail: `uptime ${humanUptime(data.uptime_s)}`
    },
    {
      label: "postgres",
      state: data.db.ok ? "ok" : "err",
      detail: data.db.ok ? `ping ${data.db.latency_ms}ms` : "unreachable"
    },
    ...Object.entries(data.services).map(([name, s]) => ({
      label: name,
      state: (s.ok ? "ok" : "err") as "ok" | "err",
      detail: s.ok ? "serving" : "check failed",
      href: SERVICE_LINKS[name]
    }))
  ];

  return (
    <div>
      <ul className="space-y-3 font-mono text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3">
            <Dot state={row.state} />
            {row.href ? (
              <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-cyan transition-colors">
                {row.label}
              </a>
            ) : (
              <span className="text-ink">{row.label}</span>
            )}
            <span className="text-faint">{row.state === "ok" ? "ok" : "down"}</span>
            <span className="ml-auto text-sub">{row.detail}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-line/70 pt-4 font-mono text-xs text-faint">
        api build{" "}
        <a
          href={`${REPO_URL}/commit/${data.version}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan hover:text-ink transition-colors"
        >
          {data.version === "dev" ? "dev" : data.version.slice(0, 7)}
        </a>{" "}
        · sibling checks run in-cluster · refreshes every 30s
      </p>
    </div>
  );
}
