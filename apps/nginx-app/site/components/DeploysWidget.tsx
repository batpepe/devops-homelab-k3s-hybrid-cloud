"use client";

import { useEffect, useState } from "react";

// Deployed versions read straight from the GitOps manifests on the default
// branch: the repo is public and raw.githubusercontent.com sends
// Access-Control-Allow-Origin: *, so this works client-side with no backend
// and no credentials. What git says is what runs - that is the whole point.

const REPO = "batpepe/devops-homelab-k3s-hybrid-cloud";
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;

const APPS: { name: string; manifest: string; live?: string }[] = [
  { name: "cv site", manifest: "k8s-infrastructure/apps/nginx/nginx-app.yaml", live: "https://cv.batpepe.online" },
  { name: "api", manifest: "k8s-infrastructure/apps/nodejs/nodejs-app.yaml" },
  { name: "museum", manifest: "k8s-infrastructure/apps/batman-museum/batman-museum.yaml", live: "https://museum.batpepe.online" },
  { name: "game", manifest: "k8s-infrastructure/apps/nginx/batman.yaml", live: "https://game.batpepe.online" },
  { name: "portal", manifest: "k8s-infrastructure/apps/portal/portal.yaml", live: "https://batpepe.online" }
];

const CACHE_KEY = "deploys-v1";
const CACHE_MS = 5 * 60 * 1000;

interface Row {
  name: string;
  sha: string;
  live?: string;
}

export default function DeploysWidget() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { at, data } = JSON.parse(cached);
        if (Date.now() - at < CACHE_MS) {
          setRows(data);
          return;
        }
      }
    } catch {
      // sessionStorage unavailable: fall through to a live fetch
    }

    Promise.allSettled(
      APPS.map((app) =>
        fetch(`${RAW}/${app.manifest}`)
          .then((r) => (r.ok ? r.text() : Promise.reject()))
          .then((text): Row | null => {
            const m = text.match(/image: ghcr\.io\/batpepe\/[a-z-]+:([0-9a-f]{40})/);
            return m ? { name: app.name, sha: m[1], live: app.live } : null;
          })
      )
    ).then((results) => {
      const found = results
        .filter((r): r is PromiseFulfilledResult<Row | null> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((r): r is Row => r !== null);
      if (found.length === 0) {
        setFailed(true);
        return;
      }
      setRows(found);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: found }));
      } catch {
        // best-effort cache only
      }
    });
  }, []);

  if (failed) {
    return <p className="font-mono text-sm text-sub">could not read the manifests</p>;
  }
  if (!rows) {
    return <p className="font-mono text-sm text-faint">reading GitOps manifests...</p>;
  }

  return (
    <div>
      <ul className="space-y-3 font-mono text-sm">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-3">
            <span className="text-ink">{row.name}</span>
            <a
              href={`https://github.com/${REPO}/commit/${row.sha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan hover:text-ink transition-colors"
            >
              {row.sha.slice(0, 7)}
            </a>
            {row.live ? (
              <a
                href={row.live}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-faint hover:text-cyan transition-colors"
              >
                open -&gt;
              </a>
            ) : (
              <span className="ml-auto text-faint">internal</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-line/70 pt-4 font-mono text-xs text-faint">
        each SHA is the exact commit running in the cluster, read from the manifest on main
      </p>
    </div>
  );
}
