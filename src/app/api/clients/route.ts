export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShopFromRequest, validateShopifySession } from "@/lib/shopify-session";

export async function GET(req: NextRequest) {
  const shop = await getShopFromRequest(req);
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 401 });
  }

  const session = await validateShopifySession(shop);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    include: {
      apiConfigs: {
        include: {
          tokens: {
            where: { isActive: true },
            select: { id: true, expiresAt: true, needsRefresh: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

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
  const { name, storeUrl, storeName, contactEmail } = body;

  if (!name || !storeUrl) {
    return NextResponse.json({ error: "Name and store URL are required" }, { status: 400 });
  }

  let normalizedUrl = storeUrl.trim().toLowerCase();
  normalizedUrl = normalizedUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!normalizedUrl.includes(".")) {
    normalizedUrl += ".myshopify.com";
  }

  const client = await prisma.client.create({
    data: {
      name,
      storeUrl: normalizedUrl,
      storeName: storeName || name,
      contactEmail,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
