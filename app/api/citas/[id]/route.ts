import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUserId(session: Awaited<ReturnType<typeof getServerSession<typeof authOptions>>>): string {
  return String(session?.user?.id ?? "");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userId = getUserId(session);
    const { id } = await params;

    const cita = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!cita) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (cita.userId !== userId && cita.stylistId !== userId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    return NextResponse.json(cita);
  } catch (error) {
    console.error("[/api/citas/[id] GET]", error);
    return NextResponse.json(
      { error: "Error al obtener cita" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userId = getUserId(session);
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !["confirmed", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "status debe ser 'confirmed' o 'cancelled'" },
        { status: 400 }
      );
    }

    const cita = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!cita) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (cita.userId !== userId && cita.stylistId !== userId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[/api/citas/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Error al actualizar cita" },
      { status: 500 }
    );
  }
}
