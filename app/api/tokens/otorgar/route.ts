import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/getAuthUser";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, otorgarSchema } from "@/lib/validations";

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

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Validate body
  const { data, error: valError } = await validateBody(req, otorgarSchema);
  if (valError) return valError;

  const { accion } = data!;

  try {
    const tokensAOtorgar = TOKENS_POR_ACCION[accion.toUpperCase()];
    if (!tokensAOtorgar) {
      return NextResponse.json(
        { error: "Acción no válida" },
        { status: 400 }
      );
    }

    const [usuarioActualizado] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { tokens: { increment: tokensAOtorgar } },
      }),
      prisma.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: tokensAOtorgar,
          type: "GANADO",
          reason: `${accion} en la plataforma`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      tokensOtorgados: tokensAOtorgar,
      totalTokens: usuarioActualizado.tokens,
    });
  } catch (error) {
    console.error("Error otorgando tokens:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
