import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse pulls in pdf.js internals that shouldn't be bundled by webpack;
  // keep it as a real Node dependency in API routes.
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingIncludes: {
    "/api/notebooks/[sessionId]/summary/route": [
      "node_modules/pdfkit/js/data/**",
    ],
  },
};

export default nextConfig;
