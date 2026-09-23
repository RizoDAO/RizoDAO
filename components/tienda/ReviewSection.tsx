"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAccesly } from "accesly";
import { MessageSquare, Star, CheckCircle, X } from "lucide-react";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";

type Review = {
  id: string;
  rating: number;
  content: string | null;
  imageUrl: string | null;
  curlType: string;
  createdAt: string;
  user: { name: string | null; avatar: string | null };
};

type ReviewSectionProps = {
  productId: string;
  onRatingUpdate?: (avg: number, count: number) => void;
};

export default function ReviewSection({ productId, onRatingUpdate }: ReviewSectionProps) {
  const { data: session } = useSession();
  const { wallet } = useAccesly();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [notification, setNotification] = useState<{ tokens: number } | null>(null);

  const userEmail = session?.user?.email || wallet?.email;

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : data.reviews ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (!userEmail) { setCheckingPurchase(false); return; }

    fetch(`/api/products/${productId}/hasPurchased?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => setHasPurchased(data.hasPurchased ?? false))
      .catch(() => setHasPurchased(false))
      .finally(() => setCheckingPurchase(false));
  }, [productId, userEmail]);

  useEffect(() => {
    if (reviews.length > 0 && onRatingUpdate) {
      const total = reviews.reduce((s, r) => s + r.rating, 0);
      const avg = Math.round((total / reviews.length) * 10) / 10;
      onRatingUpdate(avg, reviews.length);
    }
  }, [reviews, onRatingUpdate]);

  const handleReviewSuccess = (tokensEarned: number) => {
    setShowForm(false);
    setNotification({ tokens: tokensEarned });
    fetchReviews();

    setTimeout(() => setNotification(null), 4000);
  };

  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#8D6E63]" />
          <h3
            className="text-lg font-semibold text-[#3E2723]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Resenas
          </h3>
          {reviews.length > 0 && (
            <span className="text-xs text-[#A1887F] bg-[#EFEBE9] px-2 py-0.5 rounded-full">
              {reviews.length} {reviews.length === 1 ? "resena" : "resenas"}
            </span>
          )}
        </div>

        {!showForm && hasPurchased && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold bg-[#8D6E63] text-white px-4 py-2 rounded-full hover:bg-[#6D4C41] transition-colors"
          >
            Escribir resena
          </button>
        )}
      </div>

      {/* Resumen de calificacion */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 bg-[#FAF8F5] border border-[#EFEBE9] rounded-2xl p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#3E2723]" style={{ fontFamily: "var(--font-playfair)" }}>
              {averageRating}
            </p>
            <StarRating rating={Math.round(averageRating)} size="sm" />
            <p className="text-xs text-[#A1887F] mt-1">
              {reviews.length} {reviews.length === 1 ? "resena" : "resenas"}
            </p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-[#A1887F] w-3">{star}</span>
                  <Star className="w-3 h-3 text-[#C89B4F]" />
                  <div className="flex-1 h-1.5 rounded-full bg-[#EFEBE9] overflow-hidden">
                    <div className="h-full rounded-full bg-[#C89B4F] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[#A1887F] w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-[#D7CCC8] rounded-2xl p-5">
          <ReviewForm
            productId={productId}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Purchase gate */}
      {!showForm && !checkingPurchase && !hasPurchased && userEmail && (
        <div className="bg-[#FAF8F5] border border-dashed border-[#D7CCC8] rounded-2xl p-5 text-center">
          <p className="text-sm text-[#A1887F]">
            Compra este producto para escribir una resena
          </p>
        </div>
      )}

      {/* Notificacion de exito */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-[#8D6E63] to-[#BCAAA4] text-white rounded-2xl p-5 shadow-lg flex items-center gap-4 animate-in slide-in-from-right">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold">Resena publicada</p>
            <p className="text-xs text-white/80">Ganaste +{notification.tokens} tokens RIZO</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lista de resenas */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white border border-[#EFEBE9] rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EFEBE9]" />
                <div className="space-y-1">
                  <div className="h-3 bg-[#EFEBE9] rounded w-20" />
                  <div className="h-2 bg-[#EFEBE9] rounded w-12" />
                </div>
              </div>
              <div className="h-3 bg-[#EFEBE9] rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-[#FAF8F5] border border-dashed border-[#D7CCC8] rounded-2xl">
          <MessageSquare className="w-10 h-10 text-[#D7CCC8] mb-3" />
          <p className="text-sm font-semibold text-[#3E2723]">Aun no hay resenas</p>
          <p className="text-xs text-[#A1887F] mt-1 max-w-xs">
            Se el primero en compartir tu experiencia con este producto
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-[#EFEBE9] rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EFEBE9] flex items-center justify-center text-sm font-semibold text-[#8D6E63]">
                    {review.user.name?.[0] ?? "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#3E2723]">{review.user.name ?? "Usuario"}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-[10px] text-[#BCAAA4]">
                        {new Date(review.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#8D6E63] bg-[#EFEBE9] px-2 py-0.5 rounded-full">
                  {review.curlType}
                </span>
              </div>

              {review.content && (
                <p className="text-sm text-[#6D4C41] leading-relaxed mt-2">{review.content}</p>
              )}

              {review.imageUrl && (
                <img
                  src={review.imageUrl}
                  alt="Foto de resena"
                  className="mt-3 w-full max-w-xs rounded-xl border border-[#EFEBE9]"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
