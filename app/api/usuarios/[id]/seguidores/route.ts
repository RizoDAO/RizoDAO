import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type RouteContext = { params: Promise<{ id: string }> };

async function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const userEmail = req.headers.get("x-user-email");

  if (!userId && !userEmail) return null;

  return prisma.user.findUnique({
    where: userId ? { id: userId } : { email: userEmail as string },
    select: { id: true },
  });
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: userId } = await params;
    const [user, currentUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      getCurrentUser(req),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const [followers, following, relationship] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      currentUser
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: currentUser.id, followingId: userId } },
            select: { followerId: true },
          })
        : null,
    ]);

    return NextResponse.json({
      followers,
      following,
      isFollowing: Boolean(relationship),
    });
  } catch (error) {
    console.error("Error obteniendo seguidores:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
