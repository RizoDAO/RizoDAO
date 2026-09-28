import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as StellarSdk from "@stellar/stellar-sdk";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";
import { sendPurchaseConfirmationEmail } from "@/lib/email";
import { checkDiscount, registerPurchase } from "@/lib/loyaltyContract";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateBody, pagoSchema } from "@/lib/validations";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const USDC = new StellarSdk.Asset("USDC", USDC_ISSUER);

/**
 * Purchase lifecycle. A row is written as PENDING *before* the Stellar
 * transaction is submitted so a blockchain payment can never be lost if the
 * process dies mid-flight; it only becomes COMPLETED once the transaction hash
 * has been persisted (and the hash is `@unique`, so a hash can credit an order
 * at most once).
 */
type PurchaseStatus = "PENDING" | "COMPLETED" | "FAILED";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  );
}

async function submitStellarPayment(
  secretKey: string,
  destination: string,
  amountUSDC: number
): Promise<string> {
  const keypair = StellarSdk.Keypair.fromSecret(secretKey);
  const account = await server.loadAccount(keypair.publicKey());
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: USDC,
        amount: amountUSDC.toFixed(7),
      })
    )
    .addMemo(StellarSdk.Memo.text("RIZO Tienda"))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  const result = await server.submitTransaction(tx);
  return result.hash;
}

/**
 * Independently verify on Horizon that a transaction hash is a real USDC
 * payment of the expected amount from the expected wallet. Used by the
 * reconciliation path — a hash is never trusted blindly.
 */
async function verifyOnChainPayment(
  txHash: string,
  fromPublicKey: string | null,
  expectedUSDC: number
): Promise<boolean> {
  try {
    const txRecord = await server.transactions().transaction(txHash).call();
    if (!txRecord) return false;
    if (fromPublicKey && txRecord.source_account !== fromPublicKey) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: any = await server.operations().forTransaction(txHash).call();
    const pagoUSDC = ops.records.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (op: any) =>
        op.type === "payment" &&
        op.asset_code === "USDC" &&
        op.asset_issuer === USDC_ISSUER
    );
    if (!pagoUSDC) return false;
    return Math.abs(parseFloat(pagoUSDC.amount) - expectedUSDC) < 0.01;
  } catch (err) {
    console.error("[/api/pago] No se pudo verificar la tx en Horizon:", err);
    return false;
  }
}

/**
 * Credit a confirmed payment exactly once: stamp the hash on the existing
 * PENDING order, move it to COMPLETED, grant tokens and consume the discount
 * code — all in a single transaction so a partial write can never happen.
 *
 * The `stellarTxHash` column is unique: if another request already credited the
 * same hash this throws a P2002 which callers translate into an idempotent
 * success.
 */
async function recordCompletedPurchase(params: {
  purchaseId: string;
  userId: string;
  productName: string;
  tokensGanados: number;
  txHash: string;
  discountCode?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const compra = await tx.purchase.update({
      where: { id: params.purchaseId },
      data: {
        stellarTxHash: params.txHash,
        status: "COMPLETED" satisfies PurchaseStatus,
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: params.userId },
      data: { tokens: { increment: params.tokensGanados } },
    });

    await tx.tokenTransaction.create({
      data: {
        userId: params.userId,
        amount: params.tokensGanados,
        type: "COMPRA",
        reason: `Compra: ${params.productName}`,
        stellarTxHash: params.txHash,
      },
    });

    if (params.discountCode) {
      const updatedDiscount = await tx.discountCode.updateMany({
        where: {
          code: params.discountCode,
          userId: params.userId,
          used: false,
          expiresAt: { gt: new Date() },
        },
        data: { used: true, usedAt: new Date() },
      });
      if (updatedDiscount.count !== 1) {
        throw new Error("El código de descuento ya fue utilizado");
      }
    }

    return { compra, updatedUser };
  });
}

/**
 * Reconciliation for the payment-success / database-failure edge case.
 *
 * If the order is not COMPLETED yet, confirm the hash directly against Horizon
 * and retry the credit. Safe to call repeatedly: a successful credit makes the
 * order COMPLETED, and a duplicate hash is treated as already reconciled.
 */
async function reconcilePurchase(
  purchaseId: string,
  txHashOverride?: string
): Promise<boolean> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });
  if (!purchase) return false;
  if (purchase.status === "COMPLETED") return true;

  const txHash = txHashOverride || purchase.stellarTxHash;
  if (!txHash) return false;

  const verified = await verifyOnChainPayment(
    txHash,
    purchase.walletAddress,
    purchase.precioUSDC
  );
  if (!verified) return false;

  try {
    await recordCompletedPurchase({
      purchaseId: purchase.id,
      userId: purchase.userId as string,
      productName: purchase.productName,
      tokensGanados: purchase.tokensGanados,
      txHash,
    });
    return true;
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Another request already recorded this hash — the order is settled.
      await prisma.purchase
        .update({ where: { id: purchase.id }, data: { status: "COMPLETED" } })
        .catch(() => {});
      return true;
    }
    console.error("[/api/pago] Reconciliación falló:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rlError = checkRateLimit(req);
  if (rlError) return rlError;

  const { data, error: valError } = await validateBody(req, pagoSchema);
  if (valError) return valError;

  // NOTE: `precioUSDC` and `tokensGanados` are intentionally NOT read from the
  // request body. Price and reward rate are derived from the Product row below.
  const { userEmail, productId, items, paymentAsset, discountCode } = data!;

  try {
    const session = await getServerSession(authOptions);
    const authenticatedEmail = session?.user?.email;

    if (!authenticatedEmail) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (authenticatedEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: authenticatedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Resolve every line from the catalog; client prices and rewards are ignored.
    const requestedItems = items ?? [{ id: productId!, quantity: 1 }];
    const quantities = new Map<string, number>();
    for (const item of requestedItems) {
      quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
    }
    const products = await prisma.product.findMany({
      where: { id: { in: [...quantities.keys()] } },
    });
    if (!products.length || products.length !== quantities.size) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    const lines = products.map(product => ({ product, quantity: quantities.get(product.id)! }));
    const productName = lines.length === 1 && lines[0].quantity === 1
      ? lines[0].product.name
      : lines.map(({ product, quantity }) => `${product.name} x${quantity}`).join(", ");

    let discount = null;
    if (discountCode) {
      discount = await prisma.discountCode.findFirst({
        where: {
          code: discountCode,
          userId: user.id,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });
      if (!discount) {
        return NextResponse.json(
          { error: "Código de descuento inválido o expirado" },
          { status: 400 }
        );
      }
    }

    if (paymentAsset !== "USDC") {
      return NextResponse.json(
        { error: "El pago con XLM no está disponible" },
        { status: 400 }
      );
    }

    const loyaltyDiscount = user.stellarPublicKey
      ? await checkDiscount(user.stellarPublicKey)
      : 0;
    const discountPercent = Math.max(loyaltyDiscount, discount?.discount ?? 0);
    const precioUSDC = lines.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0) * (1 - discountPercent / 100);
    const tokensGanados = lines.reduce((sum, { product, quantity }) => sum + product.tokenPrice * quantity, 0);

    const rizoWallet =
      process.env.NEXT_PUBLIC_RIZO_WALLET_ADDRESS ||
      process.env.STELLAR_ISSUER_PUBLIC_KEY;
    if (!rizoWallet) {
      console.error("[/api/pago] No hay wallet receptora configurada");
      return NextResponse.json(
        { error: "Pago no disponible temporalmente" },
        { status: 503 }
      );
    }

    if (!user.stellarSecretKey || !user.stellarPublicKey) {
      return NextResponse.json(
        { error: "La cuenta no tiene una wallet Stellar configurada" },
        { status: 409 }
      );
    }

    // 1) Open the order in PENDING *before* submitting to Stellar. If the
    //    process dies between here and the confirmation we still have a
    //    traceable order for reconciliation.
    const pending = await prisma.purchase.create({
      data: {
        userId: user.id,
        walletAddress: user.stellarPublicKey,
        productName,
        precioUSDC,
        tokensGanados,
        items: lines.map(({ product, quantity }) => ({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPriceUSDC: product.price,
          unitTokens: product.tokenPrice,
        })),
        stellarTxHash: null,
        status: "PENDING" satisfies PurchaseStatus,
      },
    });

    // 2) Submit the blockchain payment.
    let txHash: string;
    try {
      txHash = await submitStellarPayment(
        decryptSecret(user.stellarSecretKey),
        rizoWallet,
        precioUSDC
      );
    } catch (stellarErr) {
      console.error(
        "[/api/pago] No se pudo confirmar el pago en Stellar:",
        stellarErr
      );
      await prisma.purchase
        .update({ where: { id: pending.id }, data: { status: "FAILED" } })
        .catch((err) =>
          console.error("[/api/pago] No se pudo marcar FAILED:", err)
        );
      return NextResponse.json(
        { error: "No se pudo confirmar el pago. Intenta de nuevo." },
        { status: 502 }
      );
    }

    // 3) Confirm the order. The unique hash guarantees at-most-once crediting.
    let compra, updatedUser;
    try {
      ({ compra, updatedUser } = await recordCompletedPurchase({
        purchaseId: pending.id,
        userId: user.id,
        productName,
        tokensGanados,
        txHash,
        discountCode,
      }));
    } catch (dbErr) {
      if (isUniqueViolation(dbErr)) {
        // The same Stellar hash is already credited — idempotent replay, no
        // double-crediting. Report success for the original order.
        const existing = await prisma.purchase.findUnique({
          where: { stellarTxHash: txHash },
        });
        return NextResponse.json({
          success: true,
          idempotent: true,
          txHash,
          txOnChain: true,
          tokensGanados,
          purchaseId: existing?.id ?? pending.id,
        });
      }

      // Payment is on-chain but the database write failed. Reconcile now and,
      // if that also fails, leave a FAILED order for the sweep to retry.
      const reconciled = await reconcilePurchase(pending.id, txHash);
      if (!reconciled) {
        await prisma.purchase
          .update({
            where: { id: pending.id },
            data: { stellarTxHash: txHash, status: "FAILED" },
          })
          .catch((err) =>
            console.error("[/api/pago] No se pudo marcar FAILED:", err)
          );
        console.error(
          "[reconciliation] Pago confirmado en Stellar sin registrar:",
          { txHash, purchaseId: pending.id, userId: user.id }
        );
        return NextResponse.json(
          {
            error:
              "Pago confirmado en Stellar pero no se pudo registrar. Se reconciliará automáticamente.",
            txHash,
            txOnChain: true,
            reconciliationPending: true,
          },
          { status: 502 }
        );
      }
      const refreshed = await prisma.purchase.findUnique({
        where: { id: pending.id },
      });
      compra = refreshed ?? pending;
      updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    }

    if (
      user.stellarSecretKey &&
      user.stellarPublicKey &&
      process.env.LOYALTY_CONTRACT_ID
    ) {
      void Promise.resolve()
        .then(() =>
          registerPurchase(
            decryptSecret(user.stellarSecretKey!),
            tokensGanados * 10
          )
        )
        .catch((err) =>
          console.error("[loyalty] register_purchase falló:", err)
        );
    }

    void sendPurchaseConfirmationEmail({
      to: user.email,
      name: user.name ?? "",
      productName,
      precioUSDC,
      tokensGanados,
      stellarTxHash: txHash,
      purchaseId: compra.id,
    }).catch((error: unknown) => {
      console.error(
        "[/api/pago] Error al enviar correo de confirmación:",
        error
      );
    });

    return NextResponse.json({
      success: true,
      txHash,
      txOnChain: true,
      tokensGanados,
      totalTokens: updatedUser?.tokens ?? user.tokens + tokensGanados,
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

/**
 * Reconciliation sweep. Retries orders whose on-chain payment succeeded but
 * whose database write failed. Idempotent, so it is safe to call from a cron
 * job or an admin script.
 */
export async function GET() {
  try {
    const pending = await prisma.purchase.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        stellarTxHash: { not: null },
      },
      select: { id: true },
      take: 50,
    });

    let reconciled = 0;
    for (const p of pending) {
      // eslint-disable-next-line no-await-in-loop
      if (await reconcilePurchase(p.id)) reconciled += 1;
    }

    return NextResponse.json({ checked: pending.length, reconciled });
  } catch (error) {
    console.error("[/api/pago] Reconciliation sweep failed:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
