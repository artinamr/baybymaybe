import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The web app manifest: the name, the paper colour and the stone mark, for home screens and browsers. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nerodyn",
    short_name: "Nerodyn",
    description: "Websites, platforms and AI automation for New Zealand businesses, from an Auckland studio.",
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    display: "browser",
    background_color: "#F6F5F2",
    theme_color: "#F6F5F2",
    lang: "en-NZ",
    icons: [
      { src: `${BASE}/apple-icon.png`, sizes: "180x180", type: "image/png" },
      { src: `${BASE}/favicon.ico`, sizes: "256x256", type: "image/x-icon" },
      { src: `${BASE}/icon.svg`, sizes: "any", type: "image/svg+xml" },
    ],
  };
}
