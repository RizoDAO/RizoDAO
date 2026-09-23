import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/getAuthUser";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, earnSchema } from "@/lib/validations";

const REGLAS_EARN: Record<string, number> = {
  post: 5,
  comentario: 2,
  resena: 10,
  perfil: 20,
  navegacion: 3,
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
  const { data, error: valError } = await validateBody(req, earnSchema);
  if (valError) return valError;

  const { accion } = data!;

  try {
    const cantidad = REGLAS_EARN[accion];

    const [usuarioActualizado] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { tokens: { increment: cantidad } },
      }),
      prisma.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: cantidad,
          type: "EARN",
          reason: `Acción: ${accion}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      tokensGanados: cantidad,
      totalTokens: usuarioActualizado.tokens,
    });
  } catch (error) {
    console.error("[/api/tokens/earn] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
