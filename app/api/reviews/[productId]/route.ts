import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "productId es requerido" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
            hairType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      content: review.content,
      curlType: review.curlType,
      createdAt: review.createdAt,
      author: {
        name: review.user.name,
        avatar: review.user.avatar,
        curlType: review.user.hairType,
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/reviews/[productId]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
