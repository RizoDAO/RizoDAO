"use client";
import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import StarRating from "./StarRating";

const CURL_TYPES = ["2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B", "4C"];

type ReviewFormProps = {
  productId: string;
  onSuccess: (tokensEarned: number) => void;
  onCancel: () => void;
};

export default function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [curlType, setCurlType] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) { setError("Selecciona una calificacion"); return; }
    if (!curlType) { setError("Selecciona tu tipo de rizo"); return; }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("rating", String(rating));
      formData.append("content", content);
      formData.append("curlType", curlType);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al enviar la resena");
        return;
      }

      onSuccess(data.tokensEarned ?? 10);
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h4 className="text-sm font-semibold text-[#3E2723]" style={{ fontFamily: "var(--font-playfair)" }}>
        Escribe una resena
      </h4>

      {/* Calificacion */}
      <div>
        <p className="text-xs text-[#A1887F] mb-2">Calificacion</p>
        <StarRating rating={rating} onChange={setRating} size="lg" />
      </div>

      {/* Tipo de rizo */}
      <div>
        <label className="text-xs text-[#A1887F] mb-2 block">
          Tipo de rizo <span className="text-red-500">*</span>
        </label>
        <select
          value={curlType}
          onChange={(e) => setCurlType(e.target.value)}
          className="w-full border border-[#D7CCC8] rounded-xl px-4 py-2.5 text-sm text-[#3E2723] bg-white focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] appearance-none"
          required
        >
          <option value="">Selecciona tu tipo de rizo</option>
          {CURL_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Texto */}
      <div>
        <label className="text-xs text-[#A1887F] mb-2 block">Comentario</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Comparte tu experiencia con este producto..."
          rows={4}
          maxLength={1000}
          className="w-full border border-[#D7CCC8] rounded-xl px-4 py-3 text-sm text-[#3E2723] placeholder:text-[#BCAAA4] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] resize-none"
        />
        <p className="text-xs text-[#BCAAA4] mt-1 text-right">{content.length}/1000</p>
      </div>

      {/* Foto opcional */}
      <div>
        <p className="text-xs text-[#A1887F] mb-2">Foto (opcional)</p>
        <div className="flex items-center gap-3">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 rounded-xl object-cover border border-[#D7CCC8]"
              />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-[#3E2723] text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-[#D7CCC8] flex flex-col items-center justify-center gap-1 hover:border-[#8D6E63] transition-colors"
            >
              <Camera className="w-5 h-5 text-[#A1887F]" />
              <span className="text-[9px] text-[#A1887F]">Subir foto</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 bg-[#8D6E63] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#6D4C41] transition-colors disabled:opacity-60"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Enviando..." : "Publicar resena"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 rounded-xl text-sm font-medium text-[#A1887F] hover:text-[#6D4C41] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
