import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const hairType = req.nextUrl.searchParams.get("hairType")?.toLowerCase();

  try {
    const products = await prisma.product.findMany({
      orderBy: { votes: "desc" },
    });

    const filtered = hairType
      ? products.filter((p) => {
          if (!p.hairTypes) return false;
          return p.hairTypes
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .includes(hairType);
        })
      : products;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("[/api/products]", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}
