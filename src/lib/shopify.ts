export const apiVersion = "2026-04";

export function getShopifyConfig() {
  const apiKey = process.env.SHOPIFY_API_KEY || process.env.SHOPIFY_CLIENT_ID;
  const apiSecret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_CLIENT_SECRET;
  const host = process.env.HOST || "http://localhost:3000";
  const scopes = process.env.SCOPES?.split(",") || ["read_products", "read_orders", "read_customers", "read_inventory"];

  if (!apiKey || !apiSecret) {
    throw new Error("SHOPIFY_API_KEY and SHOPIFY_API_SECRET must be set");
  }

  return {
    apiKey,
    apiSecretKey: apiSecret,
    apiVersion,
    scopes,
    hostName: host.replace(/^https?:\/\//, ""),
    isEmbeddedApp: true,
  };
}

export function getHost() {
  return process.env.HOST || "http://localhost:3000";
}
