"use client";

export type QuizOption = {
  value: string;
  label: string;
  emoji: string;
  description?: string;
};

export type QuizStepData = {
  id: string;
  question: string;
  subtitle?: string;
  options: QuizOption[];
};

type Props = {
  step: QuizStepData;
  selected: string;
  onSelect: (value: string) => void;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  isLoading?: boolean;
};

export default function QuizStep({
  step,
  selected,
  onSelect,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  isLoading = false,
}: Props) {
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#A1887F]">
            Paso {stepNumber} de {totalSteps}
          </span>
          <span className="text-xs font-medium text-[#A1887F]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#EFEBE9] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #8D6E63, #BCAAA4)",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8 text-center">
        <h2
          className="text-2xl md:text-3xl font-bold text-[#3E2723] mb-2"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {step.question}
        </h2>
        {step.subtitle && (
          <p className="text-sm text-[#A1887F]">{step.subtitle}</p>
        )}
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {step.options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md"
              style={{
                borderColor: isSelected ? "#8D6E63" : "#D7CCC8",
                backgroundColor: isSelected ? "#EFEBE9" : "#FFFFFF",
              }}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span
                className="text-sm font-semibold text-center"
                style={{ color: isSelected ? "#3E2723" : "#4E342E" }}
              >
                {option.label}
              </span>
              {option.description && (
                <span className="text-xs text-[#A1887F] text-center leading-snug">
                  {option.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {stepNumber > 1 && (
          <button
            onClick={onPrev}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2 border-[#D7CCC8] text-[#6D4C41] hover:border-[#8D6E63] transition-colors disabled:opacity-50"
          >
            ← Anterior
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!selected || isLoading}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: selected && !isLoading ? "#8D6E63" : "#D7CCC8",
            color: selected && !isLoading ? "#FFFFFF" : "#A1887F",
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calculando...
            </span>
          ) : stepNumber === totalSteps ? (
            "Ver mis resultados ✨"
          ) : (
            "Siguiente →"
          )}
        </button>
      </div>
    </div>
  );
}
