import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse pulls in pdf.js internals that shouldn't be bundled by webpack;
  // keep it as a real Node dependency in API routes.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
