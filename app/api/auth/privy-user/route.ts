import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { crearCuentaStellar, establecerTrustline } from "@/lib/stellar";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, privyUserSchema } from "@/lib/validations";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate body
  const { data, error: valError } = await validateBody(req, privyUserSchema);
  if (valError) return valError;

  const { email, name } = data!;

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Nuevo usuario — crear cuenta Stellar en background
      let stellarPublicKey: string | undefined;
      let stellarSecretKey: string | undefined;

      try {
        const stellar = await crearCuentaStellar();
        await establecerTrustline(stellar.secretKey);
        stellarPublicKey = stellar.publicKey;
        stellarSecretKey = stellar.secretKey;
      } catch (err) {
        console.error("Error creando cuenta Stellar:", err);
        // Seguimos sin Stellar — se reintentará después
      }

      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          stellarPublicKey: stellarPublicKey ?? null,
          stellarSecretKey: stellarSecretKey ?? null,
          tokens: 20,
        },
      });

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
        id: user.id,
        email: user.email,
        name: user.name,
        tokens: user.tokens,
        stellarPublicKey: user.stellarPublicKey,
        onboardingCompleted: user.onboardingCompleted,
        isNew: true,
      });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      tokens: user.tokens,
      stellarPublicKey: user.stellarPublicKey,
      onboardingCompleted: user.onboardingCompleted,
      isNew: false,
    });
  } catch (error) {
    console.error("[/api/auth/privy-user]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
