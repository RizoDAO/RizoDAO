/**
 * Utilidades Stellar del lado del cliente (browser only).
 * NO importar desde rutas API o código de servidor.
 */
import * as StellarSdk from "@stellar/stellar-sdk";

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

export const USDC_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const USDC_ASSET = new StellarSdk.Asset("USDC", USDC_ISSUER);

/**
 * La dirección de la tienda RIZO que recibe pagos.
 * Configura NEXT_PUBLIC_RIZO_WALLET_ADDRESS en .env.local
 * Para testnet: fondear con https://friendbot.stellar.org y establecer trustline USDC
 */
export const RIZO_WALLET =
  process.env.NEXT_PUBLIC_RIZO_WALLET_ADDRESS ??
  // Fallback testnet: el propio emisor (equivale a "quemar" los tokens en demo)
  USDC_ISSUER;

export type ResultadoPago = {
  txHash: string;
  montoUSDC: number;
};

/**
 * Construye, firma con Freighter y envía un pago USDC en Testnet.
 */
export async function pagarConUSDC(
  fromPublicKey: string,
  amountUSDC: number
): Promise<ResultadoPago> {
  const freighter = await import("@stellar/freighter-api");
  const server = new StellarSdk.Horizon.Server(HORIZON_URL);

  // Cargar cuenta del pagador
  const account = await server.loadAccount(fromPublicKey);

  // Construir transacción
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: RIZO_WALLET,
        asset: USDC_ASSET,
        amount: amountUSDC.toFixed(7),
      })
    )
    .addMemo(StellarSdk.Memo.text("RIZO Tienda"))
    .setTimeout(30)
    .build();

  // Firmar con Freighter
  const signResult = await freighter.signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: fromPublicKey,
  });

  if (signResult.error) {
    throw new Error(
      String(
        (signResult.error as { message?: string }).message ??
          "Error al firmar la transacción"
      )
    );
  }

  // Reconstruir tx firmada
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signResult.signedTxXdr!,
    NETWORK_PASSPHRASE
  );

  // Enviar a la red
  const result = await server.submitTransaction(signedTx);

  return {
    txHash: result.hash,
    montoUSDC: amountUSDC,
  };
}
