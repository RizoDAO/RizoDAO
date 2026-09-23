/**
 * lib/email.ts
 * Transactional email sending via Resend. Server-side only.
 * Each send* function swallows its own errors (logs and returns success:false)
 * so a failed email never breaks the registration/purchase/reset flow that triggered it.
 */
import React from "react";
import { Resend } from "resend";
import WelcomeEmail from "../components/emails/WelcomeEmail";
import PurchaseConfirmation from "../components/emails/PurchaseConfirmation";
import ResetPasswordEmail from "../components/emails/ResetPasswordEmail";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY no está configurado");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "RIZO <noreply@rizo.app>";
}

function getAppUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

function getExplorerUrl(txHash: string): string {
  const network = process.env.STELLAR_NETWORK === "mainnet" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${network}/tx/${txHash}`;
}

type SendResult = { success: boolean; error?: string };

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<SendResult> {
  try {
    await getResendClient().emails.send({
      from: getEmailFrom(),
      to: params.to,
      subject: `¡Bienvenida a RIZO, ${params.name}!`,
      react: <WelcomeEmail name={params.name} appUrl={getAppUrl()} />,
    });

    return { success: true };
  } catch (error) {
    console.error("[lib/email] sendWelcomeEmail falló:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendPurchaseConfirmationEmail(params: {
  to: string;
  name: string;
  productName: string;
  precioUSDC: number;
  tokensGanados: number;
  stellarTxHash: string;
  purchaseId: string;
}): Promise<SendResult> {
  try {
    await getResendClient().emails.send({
      from: getEmailFrom(),
      to: params.to,
      subject: `Compra confirmada: ${params.productName}`,
      react: (
        <PurchaseConfirmation
          name={params.name}
          productName={params.productName}
          precioUSDC={params.precioUSDC}
          tokensGanados={params.tokensGanados}
          stellarTxHash={params.stellarTxHash}
          purchaseId={params.purchaseId}
          explorerUrl={getExplorerUrl(params.stellarTxHash)}
        />
      ),
    });

    return { success: true };
  } catch (error) {
    console.error("[lib/email] sendPurchaseConfirmationEmail falló:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<SendResult> {
  try {
    await getResendClient().emails.send({
      from: getEmailFrom(),
      to: params.to,
      subject: "Restablece tu contraseña de RIZO",
      react: <ResetPasswordEmail name={params.name} resetUrl={params.resetUrl} />,
    });

    return { success: true };
  } catch (error) {
    console.error("[lib/email] sendPasswordResetEmail falló:", error);
    return { success: false, error: (error as Error).message };
  }
}
