import { NextRequest, NextResponse } from "next/server";
import {
  CREDENTIAL_TYPES,
  type CredentialType,
  getCredentials,
  requestCredential,
} from "@/lib/sbtContract";

function isCredentialType(value: unknown): value is CredentialType {
  return typeof value === "string" && CREDENTIAL_TYPES.includes(value as CredentialType);
}

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet");
    if (!wallet) {
      return NextResponse.json({ error: "Wallet requerida" }, { status: 400 });
    }

    const credentials = await getCredentials(wallet);
    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("[/api/credentials][GET]", error);
    return NextResponse.json({ credentials: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = body?.wallet as string | undefined;
    const credentialType = body?.credentialType;

    if (!wallet || !isCredentialType(credentialType)) {
      return NextResponse.json(
        { error: "wallet y credentialType son requeridos" },
        { status: 400 }
      );
    }

    await requestCredential(wallet, credentialType);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/credentials][POST]", error);
    return NextResponse.json(
      { error: "No se pudo iniciar la solicitud de credencial" },
      { status: 500 }
    );
  }
}
