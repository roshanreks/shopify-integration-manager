export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
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

  const userId = (session.user as { id: string }).id;

  const config = await prisma.apiConfig.findFirst({
    where: { id: configId, createdBy: userId },
  });

  if (!config) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  if (!config.shopifyClientId || !config.shopifyClientSecret) {
    return NextResponse.json(
      { error: "Client ID and secret not configured for this config" },
      { status: 400 }
    );
  }

  const cleanShop = shopDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  try {
    const clientSecret = decrypt(config.shopifyClientSecret);

    const response = await fetch(`https://${cleanShop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.shopifyClientId,
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

    // Calculate expiry
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

    // Deactivate existing tokens
    await prisma.token.updateMany({
      where: { configId },
      data: { isActive: false },
    });

    // Store encrypted token
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

    // Update config status
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
