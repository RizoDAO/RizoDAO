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

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    const { id: followingId } = await params;
    if (currentUser.id === followingId) {
      return NextResponse.json({ error: "No puedes seguirte a ti misma/o" }, { status: 400 });
    }

    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });
    if (!userToFollow) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUser.id, followingId } },
    });
    if (existingFollow) {
      return NextResponse.json({ follow: existingFollow, isFollowing: true });
    }

    const follow = await prisma.follow.create({
      data: { followerId: currentUser.id, followingId },
    });
    return NextResponse.json({ follow, isFollowing: true }, { status: 201 });
  } catch (error) {
    console.error("Error siguiendo usuario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    const { id: followingId } = await params;
    const result = await prisma.follow.deleteMany({
      where: { followerId: currentUser.id, followingId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "No sigues a este usuario" }, { status: 404 });
    }

    return NextResponse.json({ success: true, isFollowing: false });
  } catch (error) {
    console.error("Error dejando de seguir usuario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
