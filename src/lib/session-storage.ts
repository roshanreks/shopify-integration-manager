import { prisma } from "./db";

export interface SessionData {
  id: string;
  shop: string;
  state?: string;
  isOnline?: boolean;
  scope?: string;
  expires?: Date;
  accessToken?: string;
  userId?: bigint;
  firstName?: string;
  lastName?: string;
  email?: string;
  accountOwner?: boolean;
  locale?: string;
  collaborator?: boolean;
}

export async function storeSession(session: SessionData): Promise<boolean> {
  await prisma.shopifySession.upsert({
    where: { id: session.id },
    update: {
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline ?? false,
      scope: session.scope,
      expires: session.expires,
      accessToken: session.accessToken,
      userId: session.userId,
      firstName: session.firstName,
      lastName: session.lastName,
      email: session.email,
      accountOwner: session.accountOwner,
      locale: session.locale,
      collaborator: session.collaborator,
    },
    create: {
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline ?? false,
      scope: session.scope,
      expires: session.expires,
      accessToken: session.accessToken,
      userId: session.userId,
      firstName: session.firstName,
      lastName: session.lastName,
      email: session.email,
      accountOwner: session.accountOwner,
      locale: session.locale,
      collaborator: session.collaborator,
    },
  });
  return true;
}

export async function loadSession(id: string): Promise<SessionData | null> {
  const session = await prisma.shopifySession.findUnique({
    where: { id },
  });
  if (!session) return null;
  return {
    id: session.id,
    shop: session.shop,
    state: session.state ?? undefined,
    isOnline: session.isOnline,
    scope: session.scope ?? undefined,
    expires: session.expires ?? undefined,
    accessToken: session.accessToken ?? undefined,
    userId: session.userId ?? undefined,
    firstName: session.firstName ?? undefined,
    lastName: session.lastName ?? undefined,
    email: session.email ?? undefined,
    accountOwner: session.accountOwner,
    locale: session.locale ?? undefined,
    collaborator: session.collaborator,
  };
}

export async function deleteSession(id: string): Promise<boolean> {
  await prisma.shopifySession.delete({ where: { id } });
  return true;
}

export async function deleteSessions(shop: string): Promise<boolean> {
  await prisma.shopifySession.deleteMany({ where: { shop } });
  return true;
}

export async function findSessionsByShop(shop: string): Promise<SessionData[]> {
  const sessions = await prisma.shopifySession.findMany({
    where: { shop },
  });
  return sessions.map((s) => ({
    id: s.id,
    shop: s.shop,
    state: s.state ?? undefined,
    isOnline: s.isOnline,
    scope: s.scope ?? undefined,
    expires: s.expires ?? undefined,
    accessToken: s.accessToken ?? undefined,
    userId: s.userId ?? undefined,
    firstName: s.firstName ?? undefined,
    lastName: s.lastName ?? undefined,
    email: s.email ?? undefined,
    accountOwner: s.accountOwner,
    locale: s.locale ?? undefined,
    collaborator: s.collaborator,
  }));
}
