export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShopFromRequest, validateShopifySession } from "@/lib/shopify-session";

export async function POST(req: NextRequest) {
  const shop = await getShopFromRequest(req);
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 401 });
  }

  const session = await validateShopifySession(shop);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { configId, shopDomain } = body;

  if (!configId || !shopDomain) {
    return NextResponse.json({ error: "configId and shopDomain are required" }, { status: 400 });
  }

  const config = await prisma.apiConfig.findFirst({
    where: { id: configId },
    include: { client: true },
  });

  if (!config) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID || process.env.SHOPIFY_API_KEY;
  if (!clientId) {
    return NextResponse.json({ error: "SHOPIFY_CLIENT_ID not configured" }, { status: 500 });
  }

  const cleanShop = shopDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const state = crypto.randomUUID();

  const host = process.env.HOST || "http://localhost:3000";
  const redirectUri = `${host}/api/shopify/callback`;
  const expandedScopes = config.scopes.flatMap((s: string) => s.split(","));

  const authUrl =
    `https://${cleanShop}/admin/oauth/authorize?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&scope=${encodeURIComponent(expandedScopes.join(","))}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  return NextResponse.json({ authUrl, state });
}
