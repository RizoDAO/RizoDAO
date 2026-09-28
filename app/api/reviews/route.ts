import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getAuthUser } from "@/lib/getAuthUser";
import { addTokens } from "@/lib/loyaltyContract";
import { decryptSecret } from "@/lib/encryption";

const prisma = new PrismaClient();

const REVIEW_REWARD_TOKENS = 5;

const createReviewSchema = z.object({
  productId: z.string().min(1, "productId es requerido"),
  rating: z
    .number()
    .int("rating debe ser un número entero")
    .min(1, "rating mínimo es 1")
    .max(5, "rating máximo es 5"),
  content: z.string().optional(),
  curlType: z.string().min(1, "curlType es requerido"),
});

export async function POST(req: NextRequest) {
  // Identity is resolved on the server (NextAuth session or wallet token);
  // the client can no longer claim an account through a body email.
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue.message },
        { status: 400 }
      );
    }

    const { productId, rating, content, curlType } = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: user.id,
        status: { in: ["COMPLETED", "completed"] },
        OR: [
          { productName: product.name },
          { items: { array_contains: [{ productId: productId }] } },
        ],
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Debes comprar este producto antes de escribir una reseña" },
        { status: 403 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating,
        content: content ?? null,
        curlType,
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
            hairType: true,
          },
        },
      },
    });

    if (user.stellarSecretKey && process.env.LOYALTY_CONTRACT_ID) {
      const decryptedSecret = decryptSecret(user.stellarSecretKey);
      addTokens(decryptedSecret, REVIEW_REWARD_TOKENS).catch((err) =>
        console.error("[loyalty] addTokens falló al crear reseña:", err)
      );
    }

    await prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: REVIEW_REWARD_TOKENS,
        type: "RESEÑA",
        reason: `Reseña de: ${product.name}`,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { tokens: { increment: REVIEW_REWARD_TOKENS } },
    });

    return NextResponse.json(
      {
        id: review.id,
        userId: review.userId,
        productId: review.productId,
        rating: review.rating,
        content: review.content,
        curlType: review.curlType,
        createdAt: review.createdAt,
        author: {
          name: review.user.name,
          avatar: review.user.avatar,
          curlType: review.user.hairType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/reviews]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
