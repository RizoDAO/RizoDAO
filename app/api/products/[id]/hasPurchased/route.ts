import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ hasPurchased: false });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ hasPurchased: false });
    }

    const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });

    if (!product) {
      return NextResponse.json({ hasPurchased: false });
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: user.id,
        productName: product.name,
      },
    });

    return NextResponse.json({ hasPurchased: !!purchase });
  } catch (error) {
    console.error("[/api/products/[id]/hasPurchased]", error);
    return NextResponse.json({ hasPurchased: false });
  }
}
