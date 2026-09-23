// Shared HTML shell for all RIZO transactional emails.
// Table-based layout with inline styles for email-client compatibility (no Tailwind/CSS files).

export const RIZO_COLORS = {
  purpleDark: "#2E1065",
  purple: "#4C1D95",
  mint: "#2DD4BF",
  mintLight: "#CCFBF1",
  ink: "#1E1B2E",
  muted: "#6B7280",
  border: "#E5E7EB",
  background: "#F4F1FA",
};

type EmailLayoutProps = {
  preheader: string;
  children: React.ReactNode;
};

export default function EmailLayout({ preheader, children }: EmailLayoutProps) {
  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element -- standalone email HTML document, not a Next.js page */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RIZO</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: RIZO_COLORS.background,
          fontFamily:
            "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "none",
            overflow: "hidden",
            lineHeight: "1px",
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
          }}
        >
          {preheader}
        </div>

        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: RIZO_COLORS.background, padding: "32px 16px" }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    maxWidth: 480,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: `1px solid ${RIZO_COLORS.border}`,
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          backgroundColor: RIZO_COLORS.purpleDark,
                          padding: "28px 32px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: RIZO_COLORS.mint,
                            letterSpacing: 1,
                          }}
                        >
                          RIZO
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "32px" }}>{children}</td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "20px 32px",
                          backgroundColor: RIZO_COLORS.background,
                          borderTop: `1px solid ${RIZO_COLORS.border}`,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: RIZO_COLORS.muted,
                            textAlign: "center",
                          }}
                        >
                          RIZO — la comunidad para el pelo rizado
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function EmailButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "24px 0" }}>
      <tbody>
        <tr>
          <td
            style={{
              backgroundColor: RIZO_COLORS.mint,
              borderRadius: 999,
            }}
          >
            <a
              href={href}
              style={{
                display: "inline-block",
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 600,
                color: RIZO_COLORS.purpleDark,
                textDecoration: "none",
              }}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
