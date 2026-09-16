import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = import.meta.dirname;

const nextConfig: NextConfig = {
  agentRules: false,
  turbopack: {
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules/tailwindcss"),
    },
  },
};

export default nextConfig;
