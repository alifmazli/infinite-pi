import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // allow cors for all origins
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
