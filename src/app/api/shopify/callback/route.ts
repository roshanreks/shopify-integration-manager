export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const shop = searchParams.get("shop");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.json(
      { error: `OAuth error: ${error}`, description: errorDescription },
      { status: 400 }
    );
  }

  if (!code || !state || !shop) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  // Validate state
  const oauthState = await prisma.oAuthState.findUnique({
    where: { state },
    include: { config: true },
  });

  if (!oauthState) {
    return NextResponse.json({ error: "Invalid or expired state" }, { status: 400 });
  }

  if (oauthState.expiresAt < new Date()) {
    await prisma.oAuthState.delete({ where: { state } });
    return NextResponse.json({ error: "State expired" }, { status: 400 });
  }

  // Clean up state
  await prisma.oAuthState.delete({ where: { state } });

  // Exchange code for token
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Shopify credentials not configured" }, { status: 500 });
  }

  try {
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.json(
        { error: "Token exchange failed", details: errorData },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, scope } = tokenData;

    // Encrypt and store token
    const encryptedToken = encrypt(access_token);
    const grantedScopes = scope ? scope.split(",") : [];

    await prisma.token.create({
      data: {
        configId: oauthState.configId,
        accessToken: encryptedToken,
        grantedScopes,
        shopDomain: shop,
        isActive: true,
      },
    });

    // Update config status
    await prisma.apiConfig.update({
      where: { id: oauthState.configId },
      data: { status: "active" },
    });

    // Redirect to config detail page
    const host = process.env.HOST || "http://localhost:3000";
    return NextResponse.redirect(
      `${host}/dashboard/configs/${oauthState.configId}?oauth=success`
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
