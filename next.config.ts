import type { NextConfig } from "next";

/*
  Tailwind runs through PostCSS (postcss.config.mjs). The @tailwindcss/turbopack
  loader this template shipped with kept a stale compile of globals.css in dev.
*/
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
