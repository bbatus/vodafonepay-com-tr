import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    remotePatterns: [
      // CMS media, served from MinIO (S3-compatible object storage)
      { hostname: "localhost", port: "9000" },
      { hostname: "minio" },
    ],
  },
};

export default nextConfig;
