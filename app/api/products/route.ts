import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateSearchParams, productsQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate query params
  const { data: params, error: valError } = validateSearchParams(
    req,
    productsQuerySchema
  );
  if (valError) return valError;

  const hairTypeParam = req.nextUrl.searchParams.get("hairType")?.toLowerCase();

  try {
    const where: Record<string, unknown> = {};

    if (params?.category) {
      where.category = params.category;
    }
    if (params?.hairTypes) {
      where.hairTypes = params.hairTypes;
    }
    if (params?.minPrice !== undefined || params?.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) {
        (where.price as Record<string, number>).gte = params.minPrice;
      }
      if (params.maxPrice !== undefined) {
        (where.price as Record<string, number>).lte = params.maxPrice;
      }
    }

    const products = await prisma.product.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
    });

    // Si viene hairType por query param, filtrar en memoria por compatibilidad
    const filtered = hairTypeParam
      ? products.filter((p) => {
          if (!p.hairTypes) return false;
          return p.hairTypes
            .split(",")
            .map((t: string) => t.trim().toLowerCase())
            .includes(hairTypeParam);
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