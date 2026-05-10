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
  const { configId, accessToken, shopDomain } = body;

  if (!configId || !accessToken || !shopDomain) {
    return NextResponse.json(
      { error: "configId, accessToken, and shopDomain are required" },
      { status: 400 }
    );
  }

  const config = await prisma.apiConfig.findFirst({
    where: { id: configId },
  });

  if (!config) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  await prisma.token.updateMany({
    where: { configId },
    data: { isActive: false },
  });

  const encryptedToken = encrypt(accessToken);

  const token = await prisma.token.create({
    data: {
      configId,
      accessToken: encryptedToken,
      shopDomain: shopDomain.replace(/^https?:\/\//, "").replace(/\/+$/, ""),
      isActive: true,
      grantedScopes: config.scopes.flatMap((s: string) => s.split(",")),
    },
  });

  await prisma.apiConfig.update({
    where: { id: configId },
    data: { status: "active" },
  });

  return NextResponse.json({ success: true, tokenId: token.id });
}
