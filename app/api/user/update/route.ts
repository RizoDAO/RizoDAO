import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/getAuthUser";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, userUpdateSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Validate body
  const { data, error: valError } = await validateBody(req, userUpdateSchema);
  if (valError) return valError;

  const { nombre, bio, rol, tipoCabello } = data!;

  try {
    const roleNormalizado =
      rol === "MARCA" ? "MARCA" : rol === "ESTILISTA" ? "ESTILISTA" : "RIZADA";

    await prisma.user.update({
      where: { id: user.id },
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
