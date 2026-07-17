import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jbMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

const SITE_URL = "https://cv.batpepe.online";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kostiantyn Osmakov - Junior DevOps Engineer",
    template: "%s | Kostiantyn Osmakov"
  },
  description:
    "Junior DevOps engineer from Kyiv. This site is served from a self-hosted K3s cluster: GitOps with ArgoCD, Terraform on AWS, CI/CD with GitHub Actions and Trivy, monitored by Prometheus.",
  openGraph: {
    title: "Kostiantyn Osmakov - Junior DevOps Engineer",
    description:
      "GitOps homelab in production: K3s + ArgoCD, Terraform, GitHub Actions CI with Trivy, kube-prometheus-stack. This page is one of its workloads.",
    url: SITE_URL,
    siteName: "Kostiantyn Osmakov",
    type: "website",
    images: ["/og/home.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Kostiantyn Osmakov - Junior DevOps Engineer",
    description: "GitOps homelab in production: K3s + ArgoCD, Terraform, GitHub Actions, Prometheus.",
    images: ["/og/home.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#050510"
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Kostiantyn Osmakov",
  jobTitle: "Junior DevOps Engineer",
  url: SITE_URL,
  email: "mailto:oskostya25@gmail.com",
  address: { "@type": "PostalAddress", addressLocality: "Kyiv", addressCountry: "UA" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Kyiv Aviation Institute" },
  sameAs: ["https://github.com/batpepe", "https://www.linkedin.com/in/batpepe/"],
  knowsAbout: [
    "Kubernetes",
    "GitOps",
    "ArgoCD",
    "Terraform",
    "Ansible",
    "AWS",
    "CI/CD",
    "Docker",
    "Prometheus",
    "Linux"
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <div className="aurora" aria-hidden="true">
          <div className="aurora-spot" />
        </div>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
