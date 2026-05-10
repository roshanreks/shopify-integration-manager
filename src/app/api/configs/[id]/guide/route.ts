export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSetupGuide } from "@/lib/guide-generator";
import { Prisma } from "@prisma/client";
import { getShopFromRequest, validateShopifySession } from "@/lib/shopify-session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    include: { client: true },
  });

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const host = process.env.HOST || "http://localhost:3000";
  const redirectUri = `${host}/api/shopify/callback`;
  const shopifyClientId = process.env.SHOPIFY_CLIENT_ID || process.env.SHOPIFY_API_KEY || "";

  const guide = generateSetupGuide(
    config.client.storeUrl,
    config.scopes,
    config.name,
    shopifyClientId,
    redirectUri
  );

  await prisma.apiConfig.update({
    where: { id },
    data: { installGuide: guide as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json(guide);
}

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
    select: { installGuide: true, client: true, scopes: true, name: true },
  });

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (config.installGuide) {
    return NextResponse.json(config.installGuide);
  }

  const host = process.env.HOST || "http://localhost:3000";
  const redirectUri = `${host}/api/shopify/callback`;
  const shopifyClientId = process.env.SHOPIFY_CLIENT_ID || process.env.SHOPIFY_API_KEY || "";

  const guide = generateSetupGuide(
    config.client.storeUrl,
    config.scopes,
    config.name,
    shopifyClientId,
    redirectUri
  );

  return NextResponse.json(guide);
}
