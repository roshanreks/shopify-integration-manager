import { NextRequest } from "next/server";
import { findSessionsByShop } from "./session-storage";

export async function getShopFromRequest(req: NextRequest): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");
  if (shop) return shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  // Try header
  const shopHeader = req.headers.get("x-shopify-shop-domain");
  if (shopHeader) return shopHeader;

  return null;
}

export async function validateShopifySession(shop: string): Promise<{ accessToken: string } | null> {
  const sessions = await findSessionsByShop(shop);
  const session = sessions.find((s) => s.accessToken && s.isOnline === false);

  if (!session?.accessToken) {
    return null;
  }

  return { accessToken: session.accessToken };
}
