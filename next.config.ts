import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// The site only loads its own files; the browser never talks to Supabase directly.
// 'unsafe-inline' scripts: Next.js puts small inline scripts in every page (no nonce setup needed for a read-only site).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'", // chart and bar widths are inline styles
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${dev ? " ws:" : ""}`, // dev: hot reload websocket
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js"
  productionBrowserSourceMaps: false, // no readable source code shipped to visitors (Next's default, kept explicit)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
