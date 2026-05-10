export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
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
  const {
    name,
    clientId,
    scopes,
    apiType = "admin_graphql",
    shopifyClientId,
    shopifyClientSecret,
    oauthFlow = "authorization_code",
  } = body;

  if (!name || !clientId || !scopes || scopes.length === 0) {
    return NextResponse.json(
      { error: "Name, clientId, and at least one scope are required" },
      { status: 400 }
    );
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const data: {
    name: string;
    clientId: string;
    scopes: string[];
    apiType: string;
    oauthFlow: string;
    shopifyClientId?: string;
    shopifyClientSecret?: string;
  } = {
    name,
    clientId,
    scopes,
    apiType,
    oauthFlow,
  };

  if (shopifyClientId) {
    data.shopifyClientId = shopifyClientId;
  }
  if (shopifyClientSecret) {
    data.shopifyClientSecret = encrypt(shopifyClientSecret);
  }

  const config = await prisma.apiConfig.create({ data });

  return NextResponse.json(config, { status: 201 });
}
