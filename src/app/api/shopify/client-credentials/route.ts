export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
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
    return NextResponse.json(
      { error: "configId and shopDomain are required" },
      { status: 400 }
    );
  }

  const config = await prisma.apiConfig.findFirst({
    where: { id: configId },
    include: { client: true },
  });

  if (!config) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configAny = config as any;
  const cfgClientId = configAny.shopifyClientId as string | undefined;
  const cfgClientSecret = configAny.shopifyClientSecret as string | undefined;

  if (!cfgClientId || !cfgClientSecret) {
    return NextResponse.json(
      { error: "Client ID and secret not configured for this config" },
      { status: 400 }
    );
  }

  const cleanShop = shopDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  try {
    const clientSecret = decrypt(cfgClientSecret);

    const response = await fetch(`https://${cleanShop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: cfgClientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Token fetch failed", details: errorData },
        { status: 400 }
      );
    }

    const data = await response.json();
    const { access_token, scope, expires_in } = data;

    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.token.updateMany({
      where: { configId },
      data: { isActive: false },
    });

    const encryptedToken = encrypt(access_token);

    await prisma.token.create({
      data: {
        configId,
        accessToken: encryptedToken,
        grantedScopes: scope ? scope.split(",") : [],
        shopDomain: cleanShop,
        isActive: true,
        expiresAt,
        needsRefresh: true,
      },
    });

    await prisma.apiConfig.update({
      where: { id: configId },
      data: { status: "active" },
    });

    return NextResponse.json({
      success: true,
      expiresAt,
      expiresIn: expires_in,
    });
  } catch (err) {
    console.error("Client credentials error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
