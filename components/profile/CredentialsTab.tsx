"use client";

import { useEffect, useMemo, useState } from "react";
import { Leaf, Palette, Sparkles, Wind, BadgeCheck, Send } from "lucide-react";
import CredentialCard from "@/components/profesionales/CredentialCard";
import { CREDENTIAL_TYPES, type CredentialType } from "@/lib/sbtContract";

type CredentialItem = {
  type: CredentialType;
  dateObtained: string;
  verified: boolean;
};

const CREDENTIAL_METADATA: Record<
  CredentialType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  curl_specialist: { label: "Especialista en Rizos", icon: Sparkles },
  natural_hair: { label: "Cabello Natural", icon: Leaf },
  loc_stylist: { label: "Estilista de Locs", icon: Wind },
  color_specialist: { label: "Especialista en Color", icon: Palette },
};

type CredentialsTabProps = {
  walletAddress?: string | null;
};

export default function CredentialsTab({ walletAddress }: CredentialsTabProps) {
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [selectedType, setSelectedType] = useState<CredentialType>("curl_specialist");
  const [showRequestPanel, setShowRequestPanel] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!walletAddress) {
        setCredentials([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/credentials?wallet=${encodeURIComponent(walletAddress)}`);
        const data = await res.json();
        setCredentials(Array.isArray(data.credentials) ? data.credentials : []);
      } catch {
        setCredentials([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchCredentials();
  }, [walletAddress]);

  const requestedTypes = useMemo(
    () => new Set(credentials.map((credential) => credential.type)),
    [credentials]
  );

  const canRequest = Boolean(walletAddress);

  const requestCredential = async () => {
    if (!walletAddress || requesting) return;

    setRequesting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          credentialType: selectedType,
        }),
      });

      if (!res.ok) {
        throw new Error("Solicitud no iniciada");
      }

      setFeedback("Solicitud enviada. Revisaremos tu credencial pronto.");
      setShowRequestPanel(false);
    } catch {
      setFeedback("No pudimos enviar la solicitud. Intenta de nuevo.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#8D6E63] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#A1887F]">Consultando credenciales on-chain...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <h2
          className="text-lg font-bold text-[#3E2723]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Credenciales verificadas
        </h2>
        <button
          onClick={() => setShowRequestPanel((prev) => !prev)}
          disabled={!canRequest}
          className="inline-flex items-center gap-2 bg-[#8D6E63] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#6D4C41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          Solicitar credencial
        </button>
      </div>

      {showRequestPanel && (
        <div className="bg-white rounded-2xl border border-[#D7CCC8] p-4 mb-6">
          <label className="block text-xs text-[#A1887F] mb-2">Tipo de credencial</label>
          <div className="flex gap-3 flex-wrap">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as CredentialType)}
              className="min-w-56 rounded-xl border border-[#D7CCC8] bg-[#FAF8F5] px-3 py-2 text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20"
            >
              {CREDENTIAL_TYPES.map((type) => (
                <option
                  key={type}
                  value={type}
                  disabled={requestedTypes.has(type)}
                >
                  {CREDENTIAL_METADATA[type].label}
                  {requestedTypes.has(type) ? " (ya obtenida)" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={requestCredential}
              disabled={requesting}
              className="bg-[#8D6E63] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#6D4C41] transition-colors disabled:opacity-60"
            >
              {requesting ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p className="text-sm text-[#6D4C41] mb-4">{feedback}</p>
      )}

      {credentials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D7CCC8] py-16 px-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#EFEBE9] border border-[#D7CCC8] flex items-center justify-center mb-4">
            <BadgeCheck className="w-6 h-6 text-[#8D6E63]" />
          </div>
          <p
            className="text-base font-semibold text-[#3E2723]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Aun no tienes credenciales verificadas
          </p>
          <p className="text-sm text-[#A1887F] mt-1">
            Solicita tu primera certificacion y destaca tu especializacion para toda la comunidad.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentials.map((credential) => {
            const meta = CREDENTIAL_METADATA[credential.type];
            const Icon = meta.icon;
            return (
              <CredentialCard
                key={`${credential.type}-${credential.dateObtained}`}
                specialization={meta.label}
                dateObtained={credential.dateObtained}
                icon={<Icon className="w-5 h-5" />}
                verified={credential.verified}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
