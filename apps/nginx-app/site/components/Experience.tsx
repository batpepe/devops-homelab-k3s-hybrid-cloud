import SectionHeader from "@/components/SectionHeader";

const ROLES = [
  {
    period: "Feb 2026 - now",
    place: "Tranzzo · fintech",
    title: "Help Desk Engineer",
    body: "Automation-heavy IT operations: employee lifecycle automated with Python + n8n against AD/LDAP (roughly 40% less manual work), GCP access managed with least-privilege IAM, ZTNA/MDM/EDR across 150+ endpoints."
  },
  {
    period: "Nov 2024 - Jan 2026",
    place: "UniTalk",
    title: "Technical Support Engineer",
    body: "L1/L2 support across Windows, macOS and Linux, Google Workspace administration, centralized auth logs in Elastic with alert rules for anomalous logins, Bash automation for routine tasks."
  },
  {
    period: "Apr 2026 - now",
    place: "Homelab",
    title: "Hybrid-cloud GitOps platform",
    body: "The platform that runs this page and everything in the live section: K3s + ArgoCD, Terraform on AWS, CI/CD with GitHub Actions and Trivy, kube-prometheus-stack."
  }
];

export default function Experience() {
  return (
    <section id="experience" className="scroll-mt-8 border-b border-surface0">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader tag="experience" title="Where I have worked" />
        <ol className="relative border-l border-surface0 pl-6 space-y-10">
          {ROLES.map((role) => (
            <li key={role.place} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.85rem] top-1.5 h-2.5 w-2.5 rounded-full border border-blue bg-base"
              />
              <p className="font-mono text-xs text-overlay">{role.period}</p>
              <h3 className="mt-1 font-semibold text-ink">
                {role.title} <span className="text-overlay">·</span>{" "}
                <span className="text-blue">{role.place}</span>
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-sub">{role.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 font-mono text-xs text-sub">
          <span className="text-overlay">education:</span> BSc, Cybersecurity and Information Protection - Kyiv
          Aviation Institute
          <span className="text-overlay"> · english:</span> Upper-Intermediate (B2)
        </p>
      </div>
    </section>
  );
}
