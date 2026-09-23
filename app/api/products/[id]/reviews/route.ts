import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: id },
      include: {
        user: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("[/api/products/[id]/reviews GET]", error);
    return NextResponse.json({ error: "Error al obtener resenas" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const formData = await req.formData();
    const rating = parseInt(formData.get("rating") as string, 10);
    const content = (formData.get("content") as string) || null;
    const curlType = formData.get("curlType") as string;
    const imageFile = formData.get("image") as File | null;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Calificacion invalida (1-5)" }, { status: 400 });
    }

    if (!curlType || !/^[2-4][A-C]$/.test(curlType)) {
      return NextResponse.json({ error: "Tipo de rizo invalido" }, { status: 400 });
    }

    const userEmail = formData.get("userEmail") as string;

    let userId: string | undefined;
    if (userEmail) {
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "La imagen no debe superar los 5MB" }, { status: 400 });
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const base64 = `data:${imageFile.type};base64,${buffer.toString("base64")}`;
      imageUrl = base64;
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId: id,
        rating,
        content,
        curlType,
        imageUrl,
      },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    });

    const allReviews = await prisma.review.findMany({
      where: { productId: id },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    const tokensEarned = 10;

    await prisma.product.update({
      where: { id },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        votes: allReviews.length,
      },
    });

    await prisma.tokenTransaction.create({
      data: {
        userId,
        amount: tokensEarned,
        type: "RESENA",
        reason: "Resena de producto",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { tokens: { increment: tokensEarned } },
    });

    return NextResponse.json({ review, tokensEarned }, { status: 201 });
  } catch (error) {
    console.error("[/api/products/[id]/reviews POST]", error);
    return NextResponse.json({ error: "Error al crear resena" }, { status: 500 });
  }
}
