import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateSearchParams, userMeSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate query params
  const { data: params, error: valError } = validateSearchParams(
    req,
    userMeSchema
  );
  if (valError) return valError;

  try {
    const user = await prisma.user.findUnique({
      where: { email: params!.email },
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
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[/api/user/me]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
