import type { Metadata } from "next";
import SectionHeader from "@/components/SectionHeader";
import StatusWidget from "@/components/StatusWidget";
import VisitsChart from "@/components/VisitsChart";
import DeploysWidget from "@/components/DeploysWidget";

export const metadata: Metadata = {
  title: "Platform status",
  description:
    "Live health, visit statistics and deployed versions of the K3s homelab behind this site - straight from the cluster and the GitOps manifests.",
  openGraph: { images: ["/og/status.png"] }
};

export default function StatusPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <SectionHeader
        tag="status"
        title="The platform, live"
        intro="Nothing on this page is mocked: health comes from an in-cluster API, versions come from the GitOps manifests on main."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass p-6">
          <h3 className="mb-5 font-mono text-sm text-cyan">[health]</h3>
          <StatusWidget />
        </section>
        <section className="glass p-6">
          <h3 className="mb-5 font-mono text-sm text-cyan">[deployments]</h3>
          <DeploysWidget />
        </section>
        <section className="glass p-6 lg:col-span-2">
          <h3 className="mb-5 font-mono text-sm text-cyan">[visits]</h3>
          <VisitsChart />
        </section>
      </div>
      <p className="mt-8 max-w-2xl text-sm text-sub">
        How this works: the health panel calls a same-origin <code className="font-mono text-ink">/api/status</code>{" "}
        endpoint whose pod checks its database and the sibling workloads from inside the cluster. The
        deployments panel fetches the Kubernetes manifests from the public repo and shows the image SHAs
        pinned there - under GitOps, that is exactly what runs.
      </p>
    </main>
  );
}
