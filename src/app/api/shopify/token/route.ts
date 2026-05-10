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
  const { configId, accessToken, shopDomain } = body;

  if (!configId || !accessToken || !shopDomain) {
    return NextResponse.json(
      { error: "configId, accessToken, and shopDomain are required" },
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

  // Deactivate existing tokens
  await prisma.token.updateMany({
    where: { configId },
    data: { isActive: false },
  });

  // Store new token
  const encryptedToken = encrypt(accessToken);

  const token = await prisma.token.create({
    data: {
      configId,
      accessToken: encryptedToken,
      shopDomain: shopDomain.replace(/^https?:\/\//, "").replace(/\/+$/, ""),
      isActive: true,
      grantedScopes: config.scopes.flatMap((s: string) => s.split(",")),
    },
  });

  // Update config status
  await prisma.apiConfig.update({
    where: { id: configId },
    data: { status: "active" },
  });

  return NextResponse.json({ success: true, tokenId: token.id });
}
