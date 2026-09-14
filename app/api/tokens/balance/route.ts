import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateSearchParams, tokenBalanceSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate query params
  const { data: params, error: valError } = validateSearchParams(
    req,
    tokenBalanceSchema
  );
  if (valError) return valError;

  try {
    const user = await prisma.user.findUnique({
      where: { email: params!.email },
      select: { tokens: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tokens: user.tokens });
  } catch (error) {
    console.error("[/api/tokens/balance]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
