"use client";

import { AcceslyProvider, useAccesly, type WalletInfo } from "accesly";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { migrateGuestProfile } from "@/lib/guestCurlProfile";

const AcceslyProviderAny = AcceslyProvider as React.ComponentType<{
  children?: React.ReactNode;
}>;

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { wallet } = useAccesly();
  const router = useRouter();
  const pathname = usePathname();
  const prevWallet = useRef<WalletInfo | null>(null);

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
          if (wallet.email) {
            await migrateGuestProfile();
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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AcceslyProviderAny>
      <AuthHandler>
        {children}
      </AuthHandler>
    </AcceslyProviderAny>
  );
}

export default Providers;