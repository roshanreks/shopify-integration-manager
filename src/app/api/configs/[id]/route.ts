export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
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
      client: true,
      tokens: {
        orderBy: { installedAt: "desc" },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configAny = config as any;

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(config);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await getShopFromRequest(req);
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 401 });
  }

  const session = await validateShopifySession(shop);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.apiConfig.findFirst({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.scopes) updateData.scopes = body.scopes;
  if (body.apiType) updateData.apiType = body.apiType;
  if (body.oauthFlow) updateData.oauthFlow = body.oauthFlow;
  if (body.status) updateData.status = body.status;
  if (body.shopifyClientId) updateData.shopifyClientId = body.shopifyClientId;
  if (body.shopifyClientSecret) {
    updateData.shopifyClientSecret = encrypt(body.shopifyClientSecret);
  }
  if (body.installGuide) updateData.installGuide = body.installGuide;

  const config = await prisma.apiConfig.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(config);
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

  const existing = await prisma.apiConfig.findFirst({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.apiConfig.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
