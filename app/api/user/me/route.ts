import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    const id = req.nextUrl.searchParams.get("id");
    if (!email && !id) {
      return NextResponse.json({ error: "Email o id requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: id ? { id } : { email: email as string },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        hairType: true,
        role: true,
        tokens: true,
        avatar: true,
        stellarPublicKey: true,
        onboardingCompleted: true,
        createdAt: true,
        _count: {
          select: { posts: true, reviews: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[/api/user/me]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
