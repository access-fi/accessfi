import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Prevent zkverifyjs from being bundled - load from node_modules at runtime
  serverExternalPackages: ['zkverifyjs'],
};

export default nextConfig;
