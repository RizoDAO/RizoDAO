import EmailLayout, { EmailButton, RIZO_COLORS } from "./EmailLayout";

export type WelcomeEmailProps = {
  name: string;
  appUrl: string;
};

export default function WelcomeEmail({ name, appUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout preheader={`Bienvenida a RIZO, ${name}. Tu comunidad de pelo rizado te espera.`}>
      <h1
        style={{
          margin: "0 0 12px",
          fontSize: 22,
          fontWeight: 700,
          color: RIZO_COLORS.purpleDark,
        }}
      >
        ¡Bienvenida a RIZO, {name}!
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.6, color: RIZO_COLORS.ink }}>
        Nos alegra tenerte en la comunidad hecha por y para el pelo rizado. En RIZO vas a
        encontrar:
      </p>

      <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
        <tbody>
          {[
            ["🌀", "Contenido y comunidad curada para cada tipo de rizo, del 2A al 4C."],
            ["💧", "Tienda con productos verificados por su ficha capilar, no por moda."],
            ["✂️", "Estilistas especializados en rizos cerca de ti."],
            ["🪙", "Tokens RIZO en Stellar por cada compra, canjeables por descuentos reales."],
          ].map(([emoji, text]) => (
            <tr key={text}>
              <td style={{ padding: "6px 0", verticalAlign: "top", width: 28, fontSize: 16 }}>
                {emoji}
              </td>
              <td style={{ padding: "6px 0", fontSize: 14, lineHeight: 1.5, color: RIZO_COLORS.ink }}>
                {text}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <EmailButton href={appUrl}>Explorar RIZO</EmailButton>

      <p style={{ margin: 0, fontSize: 12, color: RIZO_COLORS.muted }}>
        Ya ganaste 20 tokens de bienvenida — revísalos en tu perfil.
      </p>
    </EmailLayout>
  );
}
