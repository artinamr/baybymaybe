import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH when building for a GitHub Pages project site
// (e.g. "/baybymaybe" for https://<user>.github.io/baybymaybe). Leave empty for
// local dev and custom-domain deployments served from the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Static HTML/CSS/JS export -> `out/` folder, deployable to GitHub Pages.
  output: "export",
  // GitHub Pages has no Next image optimizer; serve assets as-is.
  images: { unoptimized: true },
  // Emit `/foo/index.html` + `/foo/` URLs so Pages deep links resolve cleanly.
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;