import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@obsidian/shared-types",
    "@obsidian/db",
    "@obsidian/ai-service",
    "@obsidian/bug-tracker-client",
  ],
};

export default nextConfig;
