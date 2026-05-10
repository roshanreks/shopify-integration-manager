export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const clients = await prisma.client.findMany({
    where: { createdBy: userId },
    include: {
      apiConfigs: {
        include: {
          tokens: {
            where: { isActive: true },
            select: { id: true, expiresAt: true, needsRefresh: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const { name, storeUrl, storeName, contactEmail } = body;

  if (!name || !storeUrl) {
    return NextResponse.json({ error: "Name and store URL are required" }, { status: 400 });
  }

  // Normalize store URL
  let normalizedUrl = storeUrl.trim().toLowerCase();
  normalizedUrl = normalizedUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!normalizedUrl.includes(".")) {
    normalizedUrl += ".myshopify.com";
  }

  const client = await prisma.client.create({
    data: {
      name,
      storeUrl: normalizedUrl,
      storeName: storeName || name,
      contactEmail,
      createdBy: userId,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
