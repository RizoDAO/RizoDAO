import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { crearCuentaStellar, establecerTrustline } from "@/lib/stellar";
import { encryptSecret } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, registroSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate body
  const { data, error: valError } = await validateBody(req, registroSchema);
  if (valError) return valError;

  const { nombre, email, password } = data!;

  try {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este correo ya está registrado" },
        { status: 400 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear cuenta Stellar para el usuario
    const stellarAccount = await crearCuentaStellar();

    // Establecer trustline para recibir tokens RIZO
    await establecerTrustline(stellarAccount.secretKey);

    // Crear usuario en base de datos
    const user = await prisma.user.create({
      data: {
        name: nombre,
        email,
        password: hashedPassword,
        stellarPublicKey: stellarAccount.publicKey,
        stellarSecretKey: encryptSecret(stellarAccount.secretKey),
        tokens: 20, // Tokens de bienvenida
      },
    });

    // Registrar tokens de bienvenida (guard contra duplicados)
    const yaExisteBienvenida = await prisma.tokenTransaction.findFirst({
      where: { userId: user.id, reason: "Bienvenida a RIZO" },
    });
    if (!yaExisteBienvenida) {
      await prisma.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: 20,
          type: "GANADO",
          reason: "Bienvenida a RIZO",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente",
      userId: user.id,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
