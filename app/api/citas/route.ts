import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUserId(session: Awaited<ReturnType<typeof getServerSession<typeof authOptions>>>): string {
  return String(session?.user?.id ?? "");
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userId = getUserId(session);

    const citas = await prisma.appointment.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(citas);
  } catch (error) {
    console.error("[/api/citas GET]", error);
    return NextResponse.json(
      { error: "Error al obtener citas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userId = getUserId(session);
    const body = await req.json();
    const { stylistName, stylistId, date, tokensUsed, usdcAmount } = body;

    if (!stylistName || !date) {
      return NextResponse.json(
        { error: "stylistName y date son requeridos" },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: "Formato de fecha inválido" },
        { status: 400 }
      );
    }

    if (appointmentDate <= new Date()) {
      return NextResponse.json(
        { error: "La fecha debe ser en el futuro" },
        { status: 400 }
      );
    }

    const cita = await prisma.appointment.create({
      data: {
        userId,
        stylistName,
        stylistId: stylistId || null,
        date: appointmentDate,
        tokensUsed: tokensUsed || 0,
        usdcAmount: usdcAmount || 0,
        status: "pending",
      },
    });

    return NextResponse.json(cita, { status: 201 });
  } catch (error) {
    console.error("[/api/citas POST]", error);
    return NextResponse.json(
      { error: "Error al crear cita" },
      { status: 500 }
    );
  }
}
