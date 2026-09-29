import * as StellarSdk from "@stellar/stellar-sdk";

const server = new StellarSdk.Horizon.Server(
  process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org"
);

const networkPassphrase = StellarSdk.Networks.TESTNET;

function getIssuerKeypair(): StellarSdk.Keypair {
  const secret = process.env.STELLAR_ISSUER_SECRET_KEY;
  if (!secret) throw new Error("STELLAR_ISSUER_SECRET_KEY is not set");
  return StellarSdk.Keypair.fromSecret(secret);
}

function getRizoAsset(): StellarSdk.Asset {
  return new StellarSdk.Asset(
    process.env.STELLAR_ASSET_CODE || "RIZO",
    getIssuerKeypair().publicKey()
  );
}

// Crear cuenta Stellar para un usuario nuevo
export async function crearCuentaStellar(): Promise<{
  publicKey: string;
  secretKey: string;
}> {
  const keypair = StellarSdk.Keypair.random();

  // Fondear con Friendbot en testnet
  await fetch(
    `https://friendbot.stellar.org?addr=${keypair.publicKey()}`
  );

  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  };
}

// Establecer trustline para que usuario pueda recibir tokens RIZO
export async function establecerTrustline(
  userSecretKey: string
): Promise<boolean> {
  try {
    const userKeypair = StellarSdk.Keypair.fromSecret(userSecretKey);
    const account = await server.loadAccount(userKeypair.publicKey());

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: getRizoAsset(),
          limit: "1000000",
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(userKeypair);
    await server.submitTransaction(tx);
    return true;
  } catch (error) {
    console.error("Error estableciendo trustline:", error);
    return false;
  }
}

// Enviar tokens RIZO a un usuario
export async function enviarTokensRIZO(
  destinoPublicKey: string,
  cantidad: number
): Promise<boolean> {
  try {
    const issuerKeypair = getIssuerKeypair();
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

    const tx = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinoPublicKey,
          asset: getRizoAsset(),
          amount: cantidad.toString(),
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(issuerKeypair);
    await server.submitTransaction(tx);
    return true;
  } catch (error) {
    console.error("Error enviando tokens:", error);
    return false;
  }
}

// Consultar balance de tokens RIZO de un usuario
export async function consultarBalanceRIZO(
  publicKey: string
): Promise<number> {
  try {
    const account = await server.loadAccount(publicKey);
    const balance = account.balances.find(
      (b: { asset_type: string; asset_code?: string; balance: string }) =>
        b.asset_type !== "native" &&
        b.asset_code === (process.env.STELLAR_ASSET_CODE || "RIZO")
    );
    return balance ? parseFloat(balance.balance) : 0;
  } catch {
    return 0;
  }
}

// Quemar tokens al canjear
export async function quemarTokensRIZO(
  userSecretKey: string,
  cantidad: number
): Promise<boolean> {
  try {
    const userKeypair = StellarSdk.Keypair.fromSecret(userSecretKey);
    const account = await server.loadAccount(userKeypair.publicKey());

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: getIssuerKeypair().publicKey(),
          asset: getRizoAsset(),
          amount: cantidad.toString(),
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(userKeypair);
    await server.submitTransaction(tx);
    return true;
  } catch (error) {
    console.error("Error quemando tokens:", error);
    return false;
  }
}