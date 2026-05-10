import { Shopify } from "@shopify/shopify-api";
import { LATEST_API_VERSION } from "@shopify/shopify-api";

export const shopify = new Shopify({
  apiKey: process.env.SHOPIFY_CLIENT_ID!,
  apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET!,
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SHOPIFY_SCOPES?.split(",") || [
    "read_products",
    "read_orders",
    "read_customers",
  ],
  hostName: process.env.HOST?.replace(/^https?:\/\//, "") || "localhost",
  hostScheme: process.env.HOST?.startsWith("https") ? "https" : "http",
  isEmbeddedApp: true,
  isCustomStoreApp: false,
});

export function getShopifyAuthUrl(shop: string, redirectUri: string, state: string) {
  const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const scopes = process.env.SHOPIFY_SCOPES?.split(",") || [
    "read_products",
    "read_orders",
    "read_customers",
  ];

  return (
    `https://${cleanShop}/admin/oauth/authorize?` +
    `client_id=${encodeURIComponent(process.env.SHOPIFY_CLIENT_ID!)}` +
    `&scope=${encodeURIComponent(scopes.join(","))}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`
  );
}

export function verifyShopifyHmac(query: Record<string, string>, secret: string): boolean {
  const { hmac, ...params } = query;
  if (!hmac) return false;

  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const crypto = require("crypto");
  const generatedHmac = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(generatedHmac),
    Buffer.from(hmac)
  );
}

export function getEmbeddedAppUrl(shop: string, host: string): string {
  const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `https://${cleanShop}/admin/apps/${process.env.SHOPIFY_CLIENT_ID}`;
}
