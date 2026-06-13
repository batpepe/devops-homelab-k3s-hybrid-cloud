export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Same-origin image proxy, restricted to Wikimedia uploads. Keeps the browser
// away from cross-origin texture restrictions and never follows other hosts.
const ALLOWED_HOSTS = new Set(["upload.wikimedia.org"]);

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url");
  if (!raw) return new Response("missing url", { status: 400 });

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return new Response("forbidden host", { status: 403 });
  }

  const upstream = await fetch(url, {
    headers: {
      "User-Agent":
        "batman-museum-homelab/0.1 (+https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud)"
    }
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("upstream error", { status: 502 });
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable"
    }
  });
}
