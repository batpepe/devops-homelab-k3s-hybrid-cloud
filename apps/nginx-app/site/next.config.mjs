/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the site is served by the same nginx container as before,
  // so no Node runtime ships to the cluster.
  output: "export",
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
