"use client";
import { AcceslyProvider, useAccesly } from "accesly";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { migrateGuestProfile } from "@/lib/guestCurlProfile";

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { wallet } = useAccesly();
  const router = useRouter();
  const pathname = usePathname();
  const prevWallet = useRef<any>(null);

  useEffect(() => {
    const wasNull = prevWallet.current === null;
    const isNowConnected = wallet !== null && wallet !== undefined;

    if (wasNull && isNowConnected) {
      if (pathname === "/onboarding") {
        prevWallet.current = wallet;
        return;
      }

      fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stellarAddress: wallet.stellarAddress,
          email: wallet.email,
        }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          // Migrate any quiz results the user completed as a guest
          if (wallet.email) {
            await migrateGuestProfile({ email: wallet.email });
          }
          if (data.isNew) {
            router.push("/onboarding");
          } else {
            router.push("/comunidad");
          }
        })
        .catch((err) => console.error("wallet auth error:", err));
    }

    prevWallet.current = wallet ?? null;
  }, [wallet]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AcceslyProvider
      appId={process.env.NEXT_PUBLIC_ACCESLY_APP_ID!}
      network="testnet"
      theme="light"
    >
      <AuthHandler>{children}</AuthHandler>
    </AcceslyProvider>
  );
}
