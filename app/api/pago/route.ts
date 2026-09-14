import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as StellarSdk from "@stellar/stellar-sdk";
import { decryptSecret } from "@/lib/encryption";
import { registerPurchase } from "@/lib/loyaltyContract";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, pagoSchema } from "@/lib/validations";

const prisma = new PrismaClient();

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const USDC = new StellarSdk.Asset("USDC", USDC_ISSUER);

export async function POST(req: NextRequest) {
  // Rate limit
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  // Validate body
  const { data, error: valError } = await validateBody(req, pagoSchema);
  if (valError) return valError;

  const {
    userEmail,
    productName,
    precioUSDC,
    tokensGanados,
    paymentAsset,
    precioXLM,
    discountCode,
  } = data!;

  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const rizoWallet =
      process.env.NEXT_PUBLIC_RIZO_WALLET_ADDRESS ||
      process.env.STELLAR_ISSUER_PUBLIC_KEY!;

    let txHash = `rizo-${Date.now()}`;
    let txOnChain = false;

    // Intentar pago real en Stellar Testnet si el usuario tiene secret key
    if (user.stellarSecretKey && user.stellarPublicKey) {
      try {
        const keypair = StellarSdk.Keypair.fromSecret(
          decryptSecret(user.stellarSecretKey)
        );
        const account = await server.loadAccount(keypair.publicKey());

        const pagoAsset =
          paymentAsset === "XLM" ? StellarSdk.Asset.native() : USDC;
        const pagoAmount =
          paymentAsset === "XLM"
            ? Number(precioXLM).toFixed(7)
            : Number(precioUSDC).toFixed(7);

        const tx = new StellarSdk.TransactionBuilder(account, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
          .addOperation(
            StellarSdk.Operation.payment({
              destination: rizoWallet,
              asset: pagoAsset,
              amount: pagoAmount,
            })
          )
          .addMemo(StellarSdk.Memo.text("RIZO Tienda"))
          .setTimeout(30)
          .build();

        tx.sign(keypair);
        const result = await server.submitTransaction(tx);
        txHash = result.hash;
        txOnChain = true;
      } catch (stellarErr: any) {
        const resultCodes =
          stellarErr?.response?.data?.extras?.result_codes;
        console.log(
          "[Pago Stellar] fallback a demo —",
          stellarErr?.message ?? stellarErr,
          resultCodes
            ? `| result_codes: ${JSON.stringify(resultCodes)}`
            : ""
        );
      }
    }

    // Registrar compra en BD
    const compra = await prisma.purchase.create({
      data: {
        userId: user.id,
        walletAddress: user.stellarPublicKey ?? "privy-user",
        productName,
        precioUSDC,
        tokensGanados,
        stellarTxHash: txHash,
      },
    });

    // Acreditar tokens
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokens: { increment: tokensGanados } },
    });

    await prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: tokensGanados,
        type: "COMPRA",
        reason: `Compra: ${productName}`,
        stellarTxHash: txHash,
      },
    });

    // Registrar compra en contrato Soroban (fire-and-forget)
    if (
      user.stellarSecretKey &&
      user.stellarPublicKey &&
      process.env.LOYALTY_CONTRACT_ID
    ) {
      const decryptedSecret = decryptSecret(user.stellarSecretKey);
      registerPurchase(decryptedSecret, tokensGanados * 10).catch((err) =>
        console.error("[loyalty] register_purchase falló:", err)
      );
    }

    // Invalidar código de descuento si fue usado en esta compra
    if (discountCode) {
      await prisma.discountCode.updateMany({
        where: { code: discountCode, userId: user.id, used: false },
        data: { used: true, usedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      txHash,
      txOnChain,
      tokensGanados,
      totalTokens: updatedUser.tokens,
      purchaseId: compra.id,
    });
  } catch (error) {
    console.error("[/api/pago]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
