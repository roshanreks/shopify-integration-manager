export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { configId, shopDomain } = body;

  if (!configId || !shopDomain) {
    return NextResponse.json({ error: "configId and shopDomain are required" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;

  const config = await prisma.apiConfig.findFirst({
    where: { id: configId, createdBy: userId },
    include: { client: true },
  });

  if (!config) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "SHOPIFY_CLIENT_ID not configured" }, { status: 500 });
  }

  // Clean shop domain
  const cleanShop = shopDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in DB linked to configId
  await prisma.oAuthState.create({
    data: {
      state,
      configId,
      shopDomain: cleanShop,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  // Build OAuth URL
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
