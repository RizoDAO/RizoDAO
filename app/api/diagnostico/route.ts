import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/diagnostico?hairType=3A&porosity=media&thickness=media&length=largo
 *
 * Returns products filtered by curl profile. Falls back to all products
 * if no matches are found for the specific hair type.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const hairType = searchParams.get("hairType") ?? "";
    const porosity = searchParams.get("porosity") ?? "";
    const thickness = searchParams.get("thickness") ?? "";

    // Try to find products that match the hair type stored in the DB
    // Product.hairTypes is a comma-separated string like "2C,3A,3B"
    let products = await prisma.product.findMany({
      orderBy: { rating: "desc" },
      take: 12,
    });

    // Filter by hairType if the product has hairTypes metadata
    const filtered = products.filter((p) => {
      if (!p.hairTypes) return true; // no restriction → show to everyone
      const types = p.hairTypes.split(",").map((t) => t.trim().toUpperCase());
      return types.includes(hairType.toUpperCase());
    });

    // If we got at least 3 matches, use them; otherwise fall back to all products
    const result = filtered.length >= 3 ? filtered : products;

    return NextResponse.json({
      products: result.slice(0, 6),
      profile: { hairType, porosity, thickness },
    });
  } catch (error) {
    console.error("[/api/diagnostico]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/diagnostico
 *
 * Persists the curl profile to the user's record (hairType field).
 * Body: { email: string, hairType: string, porosity: string, thickness: string, length: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, hairType, porosity, thickness, length } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Encode the full profile into the hairType field as a JSON-like string
    // e.g. "3A|media|media|largo"
    const profileString = [hairType, porosity, thickness, length]
      .filter(Boolean)
      .join("|");

    await prisma.user.update({
      where: { email },
      data: { hairType: profileString },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/diagnostico POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
