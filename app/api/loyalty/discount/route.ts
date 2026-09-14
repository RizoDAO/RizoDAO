import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkDiscount } from "@/lib/loyaltyContract";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateSearchParams, loyaltyDiscountSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate query params
  const { data: params, error: valError } = validateSearchParams(
    req,
    loyaltyDiscountSchema
  );
  if (valError) return valError;

  try {
    const user = await prisma.user.findUnique({
      where: { email: params!.email },
    });
    if (!user?.stellarPublicKey) {
      return NextResponse.json({ discount: 0 });
    }

    const discount = await checkDiscount(user.stellarPublicKey);
    return NextResponse.json({ discount });
  } catch (err) {
    console.error("[loyalty/discount]", err);
    return NextResponse.json({ discount: 0 });
  }
}
