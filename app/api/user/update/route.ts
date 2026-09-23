import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, userUpdateSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate body
  const { data, error: valError } = await validateBody(req, userUpdateSchema);
  if (valError) return valError;

  const { nombre, bio, rol, tipoCabello } = data!;
  const userEmail = req.headers.get("x-user-email");
  const userId = req.headers.get("x-user-id");

  if (!userEmail && !userId) {
    return NextResponse.json(
      { error: "Usuario requerido" },
      { status: 400 }
    );
  }

  try {
    const whereClause = userEmail
      ? { email: userEmail }
      : { id: userId as string };

    const roleNormalizado =
      rol === "MARCA" ? "MARCA" : rol === "ESTILISTA" ? "ESTILISTA" : "RIZADA";

    await prisma.user.update({
      where: whereClause,
      data: {
        role: roleNormalizado,
        hairType: tipoCabello || null,
        name: nombre || undefined,
        bio: bio || null,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
