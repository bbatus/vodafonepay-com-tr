import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    remotePatterns: [
      // CMS media, served from MinIO (S3-compatible object storage). This
      // Next.js version's remotePatterns matching requires an explicit
      // `pathname` — omitting it (as the older/training-data API allowed)
      // silently matches nothing.
      { protocol: "http", hostname: "localhost", port: "9000", pathname: "/**" },
      { protocol: "http", hostname: "minio", pathname: "/**" },
    ],
    // Next 16 added an SSRF guard that refuses to fetch an upstream image
    // whose hostname resolves to a private/loopback IP (confirmed via
    // server logs: "hostname resolved to private IP" on every request for
    // the localhost:9000 MinIO URL, surfaced to the client as the
    // unrelated-looking generic 400 "url parameter is not allowed"). Local
    // dev's MinIO is only ever reachable at localhost/minio — both already
    // narrowly allowlisted above via remotePatterns — so this only widens
    // what those two already-trusted hostnames may resolve to, not what
    // hostnames are fetchable at all.
    dangerouslyAllowLocalIP: true,
    // Even with the guard above cleared, the SERVER-side optimizer still
    // can't reach the image: the URL stored on each doc is the
    // browser-facing one (S3_PUBLIC_URL=http://localhost:9000), but
    // "localhost" from inside the app container resolves to the app
    // container itself, not MinIO — confirmed via server logs
    // (ECONNREFUSED). The two containers' hostnames for the same bucket
    // are genuinely different (public: localhost:9000, internal:
    // minio:9000) and Next's built-in loader has no notion of "fetch from
    // a different host than what's displayed" without a custom loader.
    // Skip server-side re-optimization for these remote images — Payload
    // already generates purpose-sized variants (thumbnail/card/hero) via
    // its own imageSizes pipeline, so this mainly forgoes automatic
    // WebP/AVIF conversion, not resizing.
    unoptimized: true,
  },
};

export default nextConfig;
