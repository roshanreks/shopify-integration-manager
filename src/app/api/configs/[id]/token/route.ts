export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShopFromRequest, validateShopifySession } from "@/lib/shopify-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await getShopFromRequest(req);
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 401 });
  }

  const session = await validateShopifySession(shop);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const config = await prisma.apiConfig.findFirst({
    where: { id },
    include: {
      tokens: {
        orderBy: { installedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = config.tokens[0];
  if (!token) {
    return NextResponse.json({ error: "No token found" }, { status: 404 });
  }

  return NextResponse.json({
    id: token.id,
    shopDomain: token.shopDomain,
    grantedScopes: token.grantedScopes,
    expiresAt: token.expiresAt,
    isActive: token.isActive,
    needsRefresh: token.needsRefresh,
    installedAt: token.installedAt,
    lastUsedAt: token.lastUsedAt,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await getShopFromRequest(req);
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 401 });
  }

  const session = await validateShopifySession(shop);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const config = await prisma.apiConfig.findFirst({
    where: { id },
  });

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.token.updateMany({
    where: { configId: id },
    data: { isActive: false },
  });

  await prisma.apiConfig.update({
    where: { id },
    data: { status: "revoked" },
  });

  return NextResponse.json({ success: true });
}
