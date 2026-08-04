/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Next sends x-powered-by unless this is set. The Node service disables the
  // equivalent header explicitly; this app never got the same treatment and was
  // the only one of the four public hosts disclosing its framework (BUG-005).
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
