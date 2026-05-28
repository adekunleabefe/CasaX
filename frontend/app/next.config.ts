import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@casax/ui",
    "@casax/types",
    "@casax/config",
    "@casax/utils",
  ],
};

export default nextConfig;
