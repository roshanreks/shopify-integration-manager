export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getShopifyConfig, getHost } from "@/lib/shopify";
import { loadSession, storeSession, deleteSession } from "@/lib/session-storage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.json(
      { error: `OAuth error: ${error}`, description: errorDescription },
      { status: 400 }
    );
  }

  if (!code || !shop || !state) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  // Validate state
  const stateSession = await loadSession(state);
  if (!stateSession || stateSession.state !== state) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  // Clean up state session
  await deleteSession(state);

  try {
    const shopify = getShopifyConfig();
    const host = getHost();

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://${cleanShop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: shopify.apiKey,
          client_secret: shopify.apiSecretKey,
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

    // Store the session
    const sessionId = `${cleanShop}_offline`;
    await storeSession({
      id: sessionId,
      shop: cleanShop,
      isOnline: false,
      scope,
      accessToken: access_token,
    });

    // Redirect to the embedded app
    const redirectUrl = `${host}/dashboard?shop=${encodeURIComponent(cleanShop)}`;
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
