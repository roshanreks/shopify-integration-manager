export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const {
    name,
    clientId,
    scopes,
    apiType = "admin_graphql",
    shopifyClientId,
    shopifyClientSecret,
    oauthFlow = "authorization_code",
  } = body;

  if (!name || !clientId || !scopes || scopes.length === 0) {
    return NextResponse.json(
      { error: "Name, clientId, and at least one scope are required" },
      { status: 400 }
    );
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, createdBy: userId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const data: {
    name: string;
    clientId: string;
    createdBy: string;
    scopes: string[];
    apiType: string;
    oauthFlow: string;
    shopifyClientId?: string;
    shopifyClientSecret?: string;
  } = {
    name,
    clientId,
    createdBy: userId,
    scopes,
    apiType,
    oauthFlow,
  };

  if (shopifyClientId) {
    data.shopifyClientId = shopifyClientId;
  }
  if (shopifyClientSecret) {
    data.shopifyClientSecret = encrypt(shopifyClientSecret);
  }

  const config = await prisma.apiConfig.create({ data });

  return NextResponse.json(config, { status: 201 });
}
