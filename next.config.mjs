/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hongguanmp.com.sg",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nextui.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // experimental: {
  //   ppr: "incremental",
  // },
};

export default nextConfig;
