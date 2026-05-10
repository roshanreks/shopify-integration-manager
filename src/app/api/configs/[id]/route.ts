export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const config = await prisma.apiConfig.findFirst({
    where: { id, createdBy: userId },
    include: {
      client: true,
      tokens: {
        orderBy: { installedAt: "desc" },
      },
    },
  });

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(config);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const existing = await prisma.apiConfig.findFirst({
    where: { id, createdBy: userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.scopes) updateData.scopes = body.scopes;
  if (body.apiType) updateData.apiType = body.apiType;
  if (body.oauthFlow) updateData.oauthFlow = body.oauthFlow;
  if (body.status) updateData.status = body.status;
  if (body.shopifyClientId) updateData.shopifyClientId = body.shopifyClientId;
  if (body.shopifyClientSecret) {
    updateData.shopifyClientSecret = encrypt(body.shopifyClientSecret);
  }
  if (body.installGuide) updateData.installGuide = body.installGuide;

  const config = await prisma.apiConfig.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(config);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.apiConfig.findFirst({
    where: { id, createdBy: userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.apiConfig.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
