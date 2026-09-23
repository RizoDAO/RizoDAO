import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const stylists = await prisma.user.findMany({
      where: {
        role: "ESTILISTA",
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        hairType: true,
        verified: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    return NextResponse.json(stylists);
  } catch (error) {
    console.error("Error fetching stylists:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
