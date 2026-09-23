/**
 * lib/sbtContract.ts
 * Cliente para contrato Soroban de credenciales SBT.
 * SERVER-SIDE ONLY — no importar desde componentes cliente.
 */

import {
  rpc as SorobanRpc,
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Keypair,
  Address,
  scValToNative,
  Transaction,
  xdr,
} from "@stellar/stellar-sdk";

const SOROBAN_RPC = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

export const CREDENTIAL_TYPES = [
  "curl_specialist",
  "natural_hair",
  "loc_stylist",
  "color_specialist",
] as const;

export type CredentialType = (typeof CREDENTIAL_TYPES)[number];

export type SbtCredential = {
  type: CredentialType;
  dateObtained: string;
  verified: boolean;
};

function getContractId(): string {
  const id = process.env.SBT_CONTRACT_ID;
  if (!id) throw new Error("SBT_CONTRACT_ID no esta configurado en .env.local");
  return id;
}

function getRpcServer(): SorobanRpc.Server {
  return new SorobanRpc.Server(SOROBAN_RPC, { allowHttp: false });
}

function credentialTypeToScVal(credentialType: CredentialType): xdr.ScVal {
  return xdr.ScVal.scvSymbol(credentialType);
}

async function submitTx(
  methodName: string,
  args: xdr.ScVal[],
  signerSecret: string
): Promise<void> {
  const server = getRpcServer();
  const keypair = Keypair.fromSecret(signerSecret);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(getContractId());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(methodName, ...args))
    .setTimeout(30)
    .build();

  const prepared = (await server.prepareTransaction(tx)) as Transaction;
  prepared.sign(keypair);

  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === "ERROR") {
    throw new Error(`[sbt] submitTx error: ${JSON.stringify(sendResult)}`);
  }

  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const response = await server.getTransaction(sendResult.hash);
    if (response.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) return;
    if (response.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`[sbt] transaccion fallida: ${sendResult.hash}`);
    }
  }
}

async function simulateRead(
  methodName: string,
  args: xdr.ScVal[]
): Promise<ReturnType<typeof scValToNative> | null> {
  const server = getRpcServer();
  const issuerPublicKey = process.env.STELLAR_ISSUER_PUBLIC_KEY;
  if (!issuerPublicKey) throw new Error("STELLAR_ISSUER_PUBLIC_KEY no configurado");

  const account = await server.getAccount(issuerPublicKey);
  const contract = new Contract(getContractId());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(methodName, ...args))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(result)) {
    throw new Error(`[sbt] simulateRead error: ${result.error}`);
  }

  if (!result.result?.retval) return null;
  return scValToNative(result.result.retval);
}

function isCredentialType(value: unknown): value is CredentialType {
  return typeof value === "string" && CREDENTIAL_TYPES.includes(value as CredentialType);
}

function parseContractCredentials(raw: unknown): SbtCredential[] {
  if (!Array.isArray(raw)) return [];

  const parsed: SbtCredential[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const record = item as Record<string, unknown>;
    const typeValue = record.type ?? record.credential_type ?? record.credentialType;
    if (!isCredentialType(typeValue)) continue;

    const obtainedValue = record.date_obtained ?? record.dateObtained ?? record.obtained_at;
    const asDate =
      typeof obtainedValue === "string"
        ? obtainedValue
        : typeof obtainedValue === "number"
          ? new Date(obtainedValue * 1000).toISOString()
          : new Date().toISOString();

    parsed.push({
      type: typeValue,
      dateObtained: asDate,
      verified: true,
    });
  }

  return parsed;
}

export async function getCredentials(userPublicKey: string): Promise<SbtCredential[]> {
  try {
    const val = await simulateRead("get_credentials", [
      new Address(userPublicKey).toScVal(),
    ]);
    const parsed = parseContractCredentials(val);
    return parsed;
  } catch {
    return [];
  }
}

export async function hasCredential(
  userPublicKey: string,
  credentialType: CredentialType
): Promise<boolean> {
  try {
    const val = await simulateRead("has_credential", [
      new Address(userPublicKey).toScVal(),
      credentialTypeToScVal(credentialType),
    ]);
    return Boolean(val);
  } catch {
    return false;
  }
}

export async function requestCredential(
  userPublicKey: string,
  credentialType: CredentialType
): Promise<void> {
  const issuerSecret = process.env.STELLAR_ISSUER_SECRET_KEY;
  if (!issuerSecret) {
    throw new Error("STELLAR_ISSUER_SECRET_KEY no configurado");
  }

  await submitTx(
    "request_credential",
    [new Address(userPublicKey).toScVal(), credentialTypeToScVal(credentialType)],
    issuerSecret
  );
}
