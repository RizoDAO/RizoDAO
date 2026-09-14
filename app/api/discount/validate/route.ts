import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateSearchParams, discountValidateSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate query params
  const { data: params, error: valError } = validateSearchParams(
    req,
    discountValidateSchema
  );
  if (valError) return valError;

  const code = params!.code;

  try {
    const discountCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase().trim() },
      select: {
        code: true,
        discount: true,
        description: true,
        used: true,
        expiresAt: true,
      },
    });

    if (!discountCode) {
      return NextResponse.json({
        valid: false,
        error: "Codigo no encontrado",
      });
    }

    if (discountCode.used) {
      return NextResponse.json({
        valid: false,
        error: "Este codigo ya fue utilizado",
      });
    }

    if (new Date() > discountCode.expiresAt) {
      return NextResponse.json({
        valid: false,
        error: "Este codigo ha expirado",
      });
    }

    return NextResponse.json({
      valid: true,
      discount: discountCode.discount,
      description: discountCode.description,
      expiresAt: discountCode.expiresAt,
    });
  } catch (error) {
    console.error("[/api/discount/validate]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
