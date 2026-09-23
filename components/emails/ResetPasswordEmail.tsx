import EmailLayout, { EmailButton, RIZO_COLORS } from "./EmailLayout";

export type ResetPasswordEmailProps = {
  name: string;
  resetUrl: string;
};

export default function ResetPasswordEmail({ name, resetUrl }: ResetPasswordEmailProps) {
  return (
    <EmailLayout preheader="Restablece tu contraseña de RIZO. El enlace expira en 1 hora.">
      <h1
        style={{
          margin: "0 0 12px",
          fontSize: 22,
          fontWeight: 700,
          color: RIZO_COLORS.purpleDark,
        }}
      >
        Restablece tu contraseña
      </h1>
      <p style={{ margin: "0 0 8px", fontSize: 14, lineHeight: 1.6, color: RIZO_COLORS.ink }}>
        Hola {name}, recibimos una solicitud para restablecer la contraseña de tu cuenta RIZO.
      </p>
      <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.6, color: RIZO_COLORS.ink }}>
        Haz clic en el botón de abajo para elegir una nueva contraseña.
      </p>

      <EmailButton href={resetUrl}>Restablecer contraseña</EmailButton>

      <p style={{ margin: "0 0 4px", fontSize: 12, color: RIZO_COLORS.muted }}>
        Este enlace es válido por <strong>1 hora</strong> y solo puede usarse{" "}
        <strong>una vez</strong>.
      </p>
      <p style={{ margin: 0, fontSize: 12, color: RIZO_COLORS.muted }}>
        Si tú no solicitaste este cambio, puedes ignorar este correo — tu contraseña no será
        modificada.
      </p>
    </EmailLayout>
  );
}
