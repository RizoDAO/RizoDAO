import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const prisma = new PrismaClient();

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Solicita un enlace de restablecimiento de contraseña.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "El correo es requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Respuesta genérica siempre — no revelar si el correo existe o no.
    if (user) {
      const rawToken = randomBytes(32).toString("hex");

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/restablecer-password?token=${rawToken}`;

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? "",
        resetUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Si el correo existe, recibirás un enlace para restablecer tu contraseña.",
    });
  } catch (error) {
    console.error("[/api/auth/reset-password] POST Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Confirma el restablecimiento con el token de un solo uso.
export async function PUT(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "El enlace es inválido o ha expirado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("[/api/auth/reset-password] PUT Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
