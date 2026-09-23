import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, otorgarSchema } from "@/lib/validations";

const prisma = new PrismaClient();

const TOKENS_POR_ACCION: Record<string, number> = {
  PUBLICAR: 5,
  COMENTAR: 2,
  REACCIONAR: 1,
  RESENA: 10,
  NAVEGAR: 1,
};

export async function POST(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate body
  const { data, error: valError } = await validateBody(req, otorgarSchema);
  if (valError) return valError;

  const { userEmail, accion } = data!;

  try {
    const tokensAOtorgar = TOKENS_POR_ACCION[accion.toUpperCase()];
    if (!tokensAOtorgar) {
      return NextResponse.json(
        { error: "Acción no válida" },
        { status: 400 }
      );
    }

    // Actualizar tokens en BD
    const user = await prisma.user.update({
      where: { email: userEmail },
      data: { tokens: { increment: tokensAOtorgar } },
    });

    // Registrar transacción
    await prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: tokensAOtorgar,
        type: "GANADO",
        reason: `${accion} en la plataforma`,
      },
    });

    return NextResponse.json({
      success: true,
      tokensOtorgados: tokensAOtorgar,
      totalTokens: user.tokens,
    });
  } catch (error) {
    console.error("Error otorgando tokens:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
