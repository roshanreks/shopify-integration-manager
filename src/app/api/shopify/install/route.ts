export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShopifyAuthUrl } from "@/lib/shopify";

/**
 * Shopify App Install Endpoint
 * 
 * Called when merchant clicks "Add app" in Shopify admin.
 * Shopify redirects here with: ?shop=xxx.myshopify.com&timestamp=xxx&hmac=xxx
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");
  const host = searchParams.get("host");

  if (!shop) {
    return NextResponse.json(
      { error: "Missing shop parameter" },
      { status: 400 }
    );
  }

  const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  // Check if shop already exists and has an active token
  const existingToken = await prisma.token.findFirst({
    where: {
      shopDomain: cleanShop,
      isActive: true,
    },
    orderBy: { installedAt: "desc" },
  });

  if (existingToken) {
    // Shop already has the app installed - redirect to embedded app
    const embeddedUrl = host
      ? `https://${cleanShop}/admin/apps/${process.env.SHOPIFY_CLIENT_ID}?host=${host}`
      : `https://${cleanShop}/admin/apps/${process.env.SHOPIFY_CLIENT_ID}`;
    
    return NextResponse.redirect(embeddedUrl);
  }

  // Generate state for OAuth
  const state = crypto.randomUUID();

  // Store OAuth state
  await prisma.oAuthState.create({
    data: {
      state,
      configId: "install", // special marker for app install
      shopDomain: cleanShop,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
    },
  });

  // Build redirect URI
  const appHost = process.env.HOST || "http://localhost:3000";
  const redirectUri = `${appHost}/api/shopify/callback`;

  // Build Shopify OAuth URL
  const scopes = process.env.SHOPIFY_SCOPES?.split(",") || [
    "read_products",
    "read_orders",
    "read_customers",
  ];

  const authUrl =
    `https://${cleanShop}/admin/oauth/authorize?` +
    `client_id=${encodeURIComponent(process.env.SHOPIFY_CLIENT_ID!)}` +
    `&scope=${encodeURIComponent(scopes.join(","))}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(authUrl);
}
