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

  const client = await prisma.client.findFirst({
    where: { id },
    include: {
      apiConfigs: {
        include: {
          tokens: {
            where: { isActive: true },
            select: { id: true, expiresAt: true, needsRefresh: true, installedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(client);
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

  const client = await prisma.client.findFirst({
    where: { id },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.client.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
