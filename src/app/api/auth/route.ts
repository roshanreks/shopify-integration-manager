export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getShopifyConfig, getHost } from "@/lib/shopify";
import { storeSession } from "@/lib/session-storage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");

  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (!cleanShop.endsWith(".myshopify.com")) {
    return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 });
  }

  try {
    const shopify = getShopifyConfig();
    const host = getHost();

    const state = crypto.randomUUID();
    await storeSession({
      id: state,
      shop: cleanShop,
      state,
      isOnline: false,
    });

    const redirectUri = `${host}/api/auth/callback`;
    const scopes = shopify.scopes.join(",");

    const authUrl =
      `https://${cleanShop}/admin/oauth/authorize?` +
      `client_id=${encodeURIComponent(shopify.apiKey)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 });
  }
}
