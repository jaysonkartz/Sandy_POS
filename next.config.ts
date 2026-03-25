import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hongguanmp.com.sg", pathname: "/**" },
      { protocol: "https", hostname: "nextui.org", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  typedRoutes: true,
  serverExternalPackages: [],
};

export default nextConfig;
