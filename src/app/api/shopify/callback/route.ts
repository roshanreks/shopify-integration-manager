export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

/**
 * Shopify OAuth Callback
 * 
 * Handles both:
 * 1. App installation from Shopify Partners
 * 2. OAuth token refresh for existing stores
 */
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
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  // Validate state
  const oauthState = await prisma.oAuthState.findUnique({
    where: { state },
  });

  if (!oauthState) {
    return NextResponse.json(
      { error: "Invalid or expired state" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "Shopify credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const tokenResponse = await fetch(
      `https://${cleanShop}/admin/oauth/access_token`,
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

    const encryptedToken = encrypt(access_token);
    const grantedScopes = scope ? scope.split(",") : [];

    if (oauthState.configId === "install") {
      // App installation flow - create a default config for this store
      // First, ensure we have a user record for this shop
      let user = await prisma.user.findUnique({
        where: { email: `admin@${cleanShop}` },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            email: `admin@${cleanShop}`,
            name: cleanShop.replace(".myshopify.com", ""),
          },
        });
      }

      // Create or update client record for this store
      let clientRecord = await prisma.client.findFirst({
        where: { storeUrl: cleanShop },
      });

      if (!clientRecord) {
        clientRecord = await prisma.client.create({
          data: {
            id: crypto.randomUUID(),
            name: cleanShop.replace(".myshopify.com", ""),
            storeUrl: cleanShop,
            storeName: cleanShop.replace(".myshopify.com", ""),
            contactEmail: `admin@${cleanShop}`,
            createdBy: user.id,
          },
        });
      }

      // Create default API config for this store
      let config = await prisma.apiConfig.findFirst({
        where: { clientId: clientRecord.id },
      });

      if (!config) {
        config = await prisma.apiConfig.create({
          data: {
            id: crypto.randomUUID(),
            name: "Store API Access",
            clientId: clientRecord.id,
            createdBy: user.id,
            scopes: grantedScopes,
            apiType: "admin_graphql",
            status: "active",
          },
        });
      } else {
        // Update scopes
        await prisma.apiConfig.update({
          where: { id: config.id },
          data: { scopes: grantedScopes, status: "active" },
        });
      }

      // Store the token
      await prisma.token.create({
        data: {
          id: crypto.randomUUID(),
          configId: config.id,
          accessToken: encryptedToken,
          grantedScopes,
          shopDomain: cleanShop,
          isActive: true,
        },
      });

      // Redirect to embedded app
      const embeddedUrl = `https://${cleanShop}/admin/apps/${clientId}`;
      return NextResponse.redirect(embeddedUrl);
    } else {
      // Existing config OAuth flow (for additional scopes)
      await prisma.token.create({
        data: {
          id: crypto.randomUUID(),
          configId: oauthState.configId,
          accessToken: encryptedToken,
          grantedScopes,
          shopDomain: cleanShop,
          isActive: true,
        },
      });

      await prisma.apiConfig.update({
        where: { id: oauthState.configId },
        data: { status: "active" },
      });

      const host = process.env.HOST || "http://localhost:3000";
      return NextResponse.redirect(
        `${host}/dashboard/configs/${oauthState.configId}?oauth=success`
      );
    }
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
