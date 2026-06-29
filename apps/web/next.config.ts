import type { NextConfig } from "next";

// The GitHub Pages demo is a fully static export served from /stockpilot.
// It is enabled only for the demo build (NEXT_PUBLIC_DEMO=1); normal dev/prod
// builds against the real API are unaffected.
const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

const nextConfig: NextConfig = isDemo
  ? {
      output: "export",
      basePath: "/stockpilot",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
