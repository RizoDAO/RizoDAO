import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Maps hair type prefix to recommended category order for a routine
const ROUTINE_ORDER: Record<string, string[]> = {
  "2": ["Co-wash", "Shampoo", "Acondicionador", "Leave-in", "Definidores", "Geles", "Crema"],
  "3": ["Shampoo", "Acondicionador", "Leave-in", "Crema", "Definidores", "Geles", "Aceites"],
  "4": ["Shampoo", "Acondicionador", "Leave-in", "Mascarilla", "Mantequillas", "Definidores", "Aceites"],
};

export async function GET(req: NextRequest) {
  const hairType = req.nextUrl.searchParams.get("hairType")?.toLowerCase();

  if (!hairType) {
    return NextResponse.json({ error: "hairType requerido" }, { status: 400 });
  }

  try {
    const allProducts = await prisma.product.findMany({
      orderBy: { votes: "desc" },
    });

    // Filter products that include this hair type
    const matching = allProducts.filter((p) => {
      if (!p.hairTypes) return false;
      return p.hairTypes
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .includes(hairType);
    });

    // Build a routine: one product per category, in recommended order
    const prefix = hairType[0]; // "2", "3", or "4"
    const order = ROUTINE_ORDER[prefix] ?? ROUTINE_ORDER["3"];

    const routine: typeof matching = [];
    const usedIds = new Set<string>();

    // First pass: pick best product per category in routine order
    for (const cat of order) {
      const pick = matching.find(
        (p) => p.category?.toLowerCase() === cat.toLowerCase() && !usedIds.has(p.id)
      );
      if (pick) {
        routine.push(pick);
        usedIds.add(pick.id);
      }
    }

    // Second pass: add remaining matched products not yet in routine
    for (const p of matching) {
      if (!usedIds.has(p.id)) routine.push(p);
    }

    return NextResponse.json({ hairType, products: routine });
  } catch (error) {
    console.error("[/api/quiz/recommendations]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
