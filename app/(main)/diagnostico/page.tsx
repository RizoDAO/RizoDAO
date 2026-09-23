"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import QuizStep, { QuizStepData } from "@/components/diagnostico/QuizStep";
import ResultCard, { CurlProfile, ProductResult } from "@/components/diagnostico/ResultCard";

// ── Quiz steps definition ──────────────────────────────────────────────────

const STEPS: QuizStepData[] = [
  {
    id: "hairType",
    question: "¿Cuál es tu patrón de rizo?",
    subtitle: "Observa tu cabello húmedo sin productos para identificarlo mejor",
    options: [
      { value: "2A", emoji: "〰️", label: "2A — Ondas suaves",      description: "Ondas ligeras en las puntas" },
      { value: "2B", emoji: "〰️", label: "2B — Ondas definidas",   description: "Ondas en forma de S desde la mitad" },
      { value: "2C", emoji: "〰️", label: "2C — Ondas intensas",    description: "Ondas muy marcadas con frizz" },
      { value: "3A", emoji: "🌀", label: "3A — Rizos amplios",     description: "Rizos grandes y brillantes" },
      { value: "3B", emoji: "🌀", label: "3B — Rizos medianos",    description: "Rizos medianos con volumen" },
      { value: "3C", emoji: "🌀", label: "3C — Rizos apretados",   description: "Rizos densos y definidos" },
      { value: "4A", emoji: "🔁", label: "4A — Coily suave",       description: "Patrón en S muy apretado" },
      { value: "4B", emoji: "🔁", label: "4B — Coily angular",     description: "Patrón en zigzag" },
      { value: "4C", emoji: "🔁", label: "4C — Coily denso",       description: "El patrón más apretado" },
    ],
  },
  {
    id: "porosity",
    question: "¿Cuál es la porosidad de tu cabello?",
    subtitle: "Haz la prueba del vaso: pon un cabello en agua y observa si flota o se hunde",
    options: [
      {
        value: "baja",
        emoji: "🪶",
        label: "Baja",
        description: "El cabello flota. Tarda en mojarse y en absorber productos",
      },
      {
        value: "media",
        emoji: "⚖️",
        label: "Media",
        description: "El cabello se hunde lentamente. Absorbe bien la humedad",
      },
      {
        value: "alta",
        emoji: "🧽",
        label: "Alta",
        description: "El cabello se hunde rápido. Absorbe mucho pero pierde humedad fácil",
      },
      {
        value: "no-se",
        emoji: "🤷",
        label: "No lo sé",
        description: "Aún no he hecho la prueba",
      },
    ],
  },
  {
    id: "thickness",
    question: "¿Qué tan grueso es cada hebra de tu cabello?",
    subtitle: "Compara una hebra con un hilo de coser",
    options: [
      {
        value: "fino",
        emoji: "🪡",
        label: "Fino",
        description: "Más delgado que el hilo o igual de delgado",
      },
      {
        value: "media",
        emoji: "〰️",
        label: "Medio",
        description: "Similar al grosor del hilo",
      },
      {
        value: "grueso",
        emoji: "🧵",
        label: "Grueso",
        description: "Más grueso que el hilo, se siente robusto",
      },
    ],
  },
  {
    id: "length",
    question: "¿Cuál es el largo de tu cabello?",
    subtitle: "Mide con el cabello estirado",
    options: [
      { value: "corto",   emoji: "✂️",  label: "Corto",    description: "Por encima de los hombros" },
      { value: "medio",   emoji: "💆",  label: "Medio",    description: "A la altura de los hombros" },
      { value: "largo",   emoji: "🧖",  label: "Largo",    description: "Por debajo de los hombros" },
      { value: "muy-largo", emoji: "👸", label: "Muy largo", description: "Llega a la cintura o más" },
    ],
  },
];

// ── Types ──────────────────────────────────────────────────────────────────

type Answers = {
  hairType: string;
  porosity: string;
  thickness: string;
  length: string;
};

type Phase = "intro" | "quiz" | "loading" | "results";

// ── Page component ─────────────────────────────────────────────────────────

export default function DiagnosticoPage() {
  const { data: session } = useSession();
  const { wallet } = useAccesly();
  const userEmail = session?.user?.email || wallet?.email;

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    hairType: "",
    porosity: "",
    thickness: "",
    length: "",
  });
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [profile, setProfile] = useState<CurlProfile | null>(null);

  const stepKeys = ["hairType", "porosity", "thickness", "length"] as const;
  const currentKey = stepKeys[currentStep];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentKey]: value }));
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Last step — fetch results
    setPhase("loading");

    const params = new URLSearchParams({
      hairType: answers.hairType,
      porosity: answers.porosity,
      thickness: answers.thickness,
      length: answers.length,
    });

    try {
      const res = await fetch(`/api/diagnostico?${params.toString()}`);
      const data = await res.json();

      setProducts(data.products ?? []);
      setProfile({
        hairType: answers.hairType,
        porosity: answers.porosity,
        thickness: answers.thickness,
        length: answers.length,
      });

      // Persist profile to user account if logged in
      if (userEmail) {
        fetch("/api/diagnostico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            hairType: answers.hairType,
            porosity: answers.porosity,
            thickness: answers.thickness,
            length: answers.length,
          }),
        }).catch(() => {
          // Non-blocking — profile save failure shouldn't block results
        });
      }

      setPhase("results");
    } catch {
      // On error, still show results with empty products
      setProfile({
        hairType: answers.hairType,
        porosity: answers.porosity,
        thickness: answers.thickness,
        length: answers.length,
      });
      setProducts([]);
      setPhase("results");
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleRetake = () => {
    setAnswers({ hairType: "", porosity: "", thickness: "", length: "" });
    setCurrentStep(0);
    setPhase("intro");
    setProducts([]);
    setProfile(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">

        {/* ── Intro ── */}
        {phase === "intro" && (
          <div className="flex flex-col items-center text-center py-12 gap-6">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
              style={{ background: "linear-gradient(135deg, #EFEBE9, #D7CCC8)" }}
            >
              🌀
            </div>
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold text-[#3E2723] mb-3"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Diagnóstico de Rizo
              </h1>
              <p className="text-[#6D4C41] max-w-md mx-auto leading-relaxed">
                Responde 4 preguntas rápidas y descubre tu perfil de cabello.
                Te recomendaremos los productos perfectos para tu tipo de rizo.
              </p>
            </div>

            {/* What you'll learn */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {[
                { emoji: "🌀", text: "Tu patrón de rizo" },
                { emoji: "💧", text: "Tu porosidad" },
                { emoji: "🧴", text: "Productos ideales" },
                { emoji: "💡", text: "Rutina personalizada" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="bg-white rounded-2xl border border-[#D7CCC8] p-4 flex items-center gap-3"
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-xs font-medium text-[#4E342E]">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setPhase("quiz")}
                className="bg-[#8D6E63] text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-[#6D4C41] transition-colors shadow-sm"
              >
                Comenzar diagnóstico →
              </button>
              <p className="text-xs text-[#A1887F]">Solo 4 preguntas · menos de 2 minutos</p>
            </div>
          </div>
        )}

        {/* ── Quiz ── */}
        {phase === "quiz" && (
          <QuizStep
            step={STEPS[currentStep]}
            selected={answers[currentKey]}
            onSelect={handleSelect}
            stepNumber={currentStep + 1}
            totalSteps={STEPS.length}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {/* ── Loading ── */}
        {phase === "loading" && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#EFEBE9] border-t-[#8D6E63] rounded-full animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">
                🌀
              </span>
            </div>
            <div className="text-center">
              <p
                className="text-lg font-semibold text-[#3E2723] mb-1"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Analizando tu perfil...
              </p>
              <p className="text-sm text-[#A1887F]">
                Buscando los mejores productos para ti
              </p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {phase === "results" && profile && (
          <>
            {/* Success banner */}
            <div className="bg-gradient-to-r from-[#8D6E63] to-[#BCAAA4] text-white px-6 py-5 rounded-2xl mb-6 flex items-center gap-4">
              <span className="text-3xl">✨</span>
              <div>
                <p
                  className="text-base font-semibold"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  ¡Tu diagnóstico está listo!
                </p>
                <p className="text-sm opacity-90">
                  {userEmail
                    ? "Tu perfil ha sido guardado en tu cuenta."
                    : "Inicia sesión para guardar tu perfil."}
                </p>
              </div>
            </div>

            <ResultCard
              profile={profile}
              products={products}
              onRetake={handleRetake}
            />
          </>
        )}
      </div>
    </div>
  );
}
