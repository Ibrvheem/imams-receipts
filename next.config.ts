import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev badge sits on top of the phone tab bar.
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  // The service worker must never be cached, or updates to it get stuck.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  images: {
    // Add the hosts you serve images from (e.g. your S3 buckets or CDN).
    remotePatterns: [
      // { protocol: "https", hostname: "your-bucket.s3.us-west-2.amazonaws.com" },
    ],
  },
};

export default nextConfig;
