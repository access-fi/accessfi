import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Prevent these packages from being bundled - load from node_modules at runtime
  serverExternalPackages: ['@zk-email/sdk', 'zkverifyjs'],
};

export default nextConfig;
