import EmailLayout, { EmailButton, RIZO_COLORS } from "./EmailLayout";

export type PurchaseConfirmationProps = {
  name: string;
  productName: string;
  precioUSDC: number;
  tokensGanados: number;
  stellarTxHash: string;
  explorerUrl: string;
  purchaseId: string;
};

export default function PurchaseConfirmation({
  name,
  productName,
  precioUSDC,
  tokensGanados,
  stellarTxHash,
  explorerUrl,
  purchaseId,
}: PurchaseConfirmationProps) {
  return (
    <EmailLayout preheader={`Tu compra de ${productName} fue confirmada.`}>
      <h1
        style={{
          margin: "0 0 12px",
          fontSize: 22,
          fontWeight: 700,
          color: RIZO_COLORS.purpleDark,
        }}
      >
        ¡Gracias por tu compra, {name}!
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.6, color: RIZO_COLORS.ink }}>
        Confirmamos tu pedido. Aquí está el detalle:
      </p>

      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{
          backgroundColor: RIZO_COLORS.background,
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <tbody>
          {[
            ["Producto", productName],
            ["Monto pagado", `${precioUSDC.toFixed(2)} USDC`],
            ["Tokens ganados", `+${tokensGanados} RIZO`],
            ["ID de pedido", purchaseId],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: "4px 0", fontSize: 12, color: RIZO_COLORS.muted, width: 130 }}>
                {label}
              </td>
              <td style={{ padding: "4px 0", fontSize: 13, fontWeight: 600, color: RIZO_COLORS.ink }}>
                {value}
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: "4px 0", fontSize: 12, color: RIZO_COLORS.muted, verticalAlign: "top" }}>
              Stellar Tx Hash
            </td>
            <td style={{ padding: "4px 0", fontSize: 11, fontFamily: "monospace", color: RIZO_COLORS.ink, wordBreak: "break-all" }}>
              {stellarTxHash}
            </td>
          </tr>
        </tbody>
      </table>

      <EmailButton href={explorerUrl}>Verificar en Stellar</EmailButton>

      <p style={{ margin: 0, fontSize: 12, color: RIZO_COLORS.muted }}>
        Puedes verificar esta transacción de forma independiente en la red Stellar usando el
        enlace de arriba.
      </p>
    </EmailLayout>
  );
}
