"use client";

type StarRatingProps = {
  rating: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
};

const sizes = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

export default function StarRating({ rating, onChange, size = "md", disabled }: StarRatingProps) {
  const isInteractive = !!onChange && !disabled;

  return (
    <div
      className={`flex items-center gap-0.5 ${isInteractive ? "cursor-pointer" : ""}`}
      role={isInteractive ? "radiogroup" : "img"}
      aria-label={`${rating} de 5 estrellas`}
      aria-roledescription={isInteractive ? "selector de calificacion" : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;

        if (isInteractive) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === rating}
              aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
              tabIndex={star === 1 ? 0 : -1}
              onClick={() => onChange(star)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" && star < 5) {
                  e.preventDefault();
                  (e.currentTarget.nextElementSibling as HTMLButtonElement)?.focus();
                }
                if (e.key === "ArrowLeft" && star > 1) {
                  e.preventDefault();
                  (e.currentTarget.previousElementSibling as HTMLButtonElement)?.focus();
                }
              }}
              className={`${sizes[size]} transition-colors focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/40 rounded`}
              style={{ color: filled ? "#C89B4F" : "#D7CCC8" }}
            >
              ★
            </button>
          );
        }

        return (
          <span
            key={star}
            className={sizes[size]}
            style={{ color: filled ? "#C89B4F" : "#D7CCC8" }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
