import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, walletSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate body
  const { data, error: valError } = await validateBody(req, walletSchema);
  if (valError) return valError;

  const { stellarAddress, email } = data!;

  try {
    let user = await prisma.user.findFirst({
      where: { email: email ?? "" },
    });

    if (user) {
      const perfilCompleto = !!user.name && user.name !== email?.split("@")[0];
      return NextResponse.json({ isNew: !perfilCompleto, user });
    }

    // Crear usuario nuevo
    user = await prisma.user.create({
      data: {
        email: email ?? `${stellarAddress}@stellar.rizo`,
        name: email?.split("@")[0] ?? "Rizado/a",
        tokens: 0,
      },
    });

    return NextResponse.json({ isNew: true, user });
  } catch (error) {
    console.error("[/api/auth/wallet]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
