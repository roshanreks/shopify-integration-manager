export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSetupGuide } from "@/lib/guide-generator";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const config = await prisma.apiConfig.findFirst({
    where: { id, createdBy: userId },
    include: { client: true },
  });

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const host = process.env.HOST || "http://localhost:3000";
  const redirectUri = `${host}/api/shopify/callback`;
  const shopifyClientId = process.env.SHOPIFY_CLIENT_ID || "";

  const guide = generateSetupGuide(
    config.client.storeUrl,
    config.scopes,
    config.name,
    shopifyClientId,
    redirectUri
  );

  // Save guide to config
  await prisma.apiConfig.update({
    where: { id },
    data: { installGuide: guide as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json(guide);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const config = await prisma.apiConfig.findFirst({
    where: { id, createdBy: userId },
    select: { installGuide: true, client: true, scopes: true, name: true },
  });

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (config.installGuide) {
    return NextResponse.json(config.installGuide);
  }

  // Generate on the fly if not saved
  const host = process.env.HOST || "http://localhost:3000";
  const redirectUri = `${host}/api/shopify/callback`;
  const shopifyClientId = process.env.SHOPIFY_CLIENT_ID || "";

  const guide = generateSetupGuide(
    config.client.storeUrl,
    config.scopes,
    config.name,
    shopifyClientId,
    redirectUri
  );

  return NextResponse.json(guide);
}
