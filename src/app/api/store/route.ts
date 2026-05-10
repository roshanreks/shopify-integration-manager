import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/store
 * 
 * Returns the store data for the currently authenticated user's primary store.
 * Used by the embedded Shopify app dashboard.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Find the user and their clients (stores)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        clients: {
          include: {
            apiConfigs: {
              include: {
                tokens: {
                  orderBy: { installedAt: "desc" },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.clients.length === 0) {
      return NextResponse.json(
        { error: "No store found. Please install the app from your Shopify admin." },
        { status: 404 }
      );
    }

    // Return the first (primary) store
    const primaryClient = user.clients[0];

    return NextResponse.json({
      storeUrl: primaryClient.storeUrl,
      storeName: primaryClient.storeName || primaryClient.storeUrl,
      configs: primaryClient.apiConfigs.map((config) => ({
        id: config.id,
        name: config.name,
        status: config.status,
        apiType: config.apiType,
        scopes: config.scopes,
        tokens: config.tokens.map((token) => ({
          id: token.id,
          expiresAt: token.expiresAt?.toISOString() || null,
          needsRefresh: token.needsRefresh,
          installedAt: token.installedAt.toISOString(),
        })),
      })),
    });
  } catch (err) {
    console.error("Store API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
