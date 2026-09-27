import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type DiagnosticoBody = {
  curlPattern?: string;
  porosity?: string;
  thickness?: string;
  length?: string;
};

const REQUIRED_FIELDS: (keyof DiagnosticoBody)[] = [
  "curlPattern",
  "porosity",
  "thickness",
  "length",
];

function normalizeValue(value: string) {
  return value.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DiagnosticoBody;
    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = body[field];
      return typeof value !== "string" || normalizeValue(value).length === 0;
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Campos requeridos faltantes",
          missingFields,
        },
        { status: 400 }
      );
    }

    const curlType = normalizeValue(body.curlPattern as string).toUpperCase();
    const profile = {
      curlPattern: curlType,
      porosity: normalizeValue(body.porosity as string).toLowerCase(),
      thickness: normalizeValue(body.thickness as string).toLowerCase(),
      length: normalizeValue(body.length as string).toLowerCase(),
    };

    const products = await prisma.product.findMany({
      where: {
        hairTypes: {
          contains: curlType,
        },
      },
      orderBy: [
        { rating: "desc" },
        { votes: "desc" },
        { createdAt: "desc" },
      ],
      take: 6,
    });

    const userEmail = req.headers.get("x-user-email");
    const userId = req.headers.get("x-user-id");
    let userUpdated = false;

    if (userEmail || userId) {
      const updateResult = await prisma.user.updateMany({
        where: userEmail ? { email: userEmail } : { id: userId as string },
        data: {
          curlType,
          hairType: curlType,
        },
      });
      userUpdated = updateResult.count > 0;
    }

    return NextResponse.json({
      curlType,
      profile,
      products,
      recommendations: products,
      userUpdated,
    });
  } catch (error) {
    console.error("[/api/diagnostico]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
