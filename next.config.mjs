// next.config.mjs
export default {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hongguanmp.com.sg", pathname: "/**" },
      { protocol: "https", hostname: "nextui.org", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  experimental: {
    typedRoutes: false,
  },
};
