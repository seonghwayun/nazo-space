import type { NextConfig } from "next";

// next/image only optimizes images from these hosts (anything else fails to load):
// - our R2 bucket, where every nazo cover lives at nazo/<nazoId>.<ext>
// - Google profile photos (session.user.image on the My page)
const R2_HOST = (() => {
  try {
    return new URL(process.env.R2_PUBLIC_URL ?? "").hostname;
  } catch {
    return "nazo-img.respace.cc";
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: R2_HOST, pathname: "/nazo/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
