import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SHOPIFY_CLIENT_ID: process.env.SHOPIFY_CLIENT_ID,
  },
};

export default nextConfig;
