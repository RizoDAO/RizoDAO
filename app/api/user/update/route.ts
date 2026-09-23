import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { nombre, bio, rol, tipoCabello, latitude, longitude } = await req.json();
    const userEmail = req.headers.get("x-user-email");
    const userId = req.headers.get("x-user-id");

    if (!userEmail && !userId) {
      return NextResponse.json({ error: "Usuario requerido" }, { status: 400 });
    }

    const whereClause = userEmail 
      ? { email: userEmail }
      : { id: userId as string };

    const roleNormalizado =
      rol?.toUpperCase() === "MARCA" ? "MARCA" :
      rol?.toUpperCase() === "ESTILISTA" ? "ESTILISTA" :
      "RIZADA";

    await prisma.user.update({
      where: whereClause,
      data: {
        role: roleNormalizado,
        hairType: tipoCabello || null,
        name: nombre || undefined,
        bio: bio || null,
        latitude: latitude !== undefined ? (latitude === null ? null : parseFloat(latitude)) : undefined,
        longitude: longitude !== undefined ? (longitude === null ? null : parseFloat(longitude)) : undefined,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}