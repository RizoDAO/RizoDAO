"use client";
import { useState } from "react";
import Link from "next/link";

type Post = {
  id: string;
  userId: string;
  autor: string;
  handle: string;
  avatar: string;
  tiempo: string;
  contenido: string;
  imagen?: string;
  likes: number;
  comentarios: number;
  tipo: "rizada" | "marca" | "estilista";
};

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);

  const badgeColor = {
    marca: { bg: "#EEEDFE", text: "#534AB7", label: "Marca" },
    estilista: { bg: "#E1F5EE", text: "#0F6E56", label: "Estilista" },
    rizada: { bg: "", text: "", label: "" },
  };

  const badge = badgeColor[post.tipo];

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 border border-[#D7CCC8]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/perfil?usuario=${post.userId}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[#D7CCC8] flex items-center justify-center text-lg font-bold text-[#8D6E63]"
            style={{ fontFamily: "var(--font-playfair)" }}>
            {post.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#3E2723] group-hover:underline">{post.autor}</span>
              {post.tipo !== "rizada" && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: badge.bg, color: badge.text }}>
                  ✓ {badge.label}
                </span>
              )}
            </div>
            <span className="text-xs text-[#A1887F]">{post.handle} · {post.tiempo}</span>
          </div>
        </Link>
        <button className="text-[#A1887F] hover:text-[#8D6E63] text-lg">···</button>
      </div>

      {/* Contenido */}
      <p className="text-sm text-[#4E342E] leading-relaxed">{post.contenido}</p>

      {/* Imagen opcional */}
      {post.imagen && (
        <div className="w-full h-56 rounded-xl overflow-hidden bg-[#D7CCC8] flex items-center justify-center">
          <span className="text-4xl">{post.imagen}</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-5 pt-1 border-t border-[#FAF8F5]">
        <button
          onClick={() => { setLiked(!liked); setLikes(liked ? likes - 1 : likes + 1); }}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: liked ? "#8D6E63" : "#A1887F" }}
        >
          <span className="text-base">{liked ? "♥" : "♡"}</span>
          {likes}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-[#A1887F] hover:text-[#8D6E63] transition-colors">
          <span className="text-base">💬</span>
          {post.comentarios}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-[#A1887F] hover:text-[#8D6E63] transition-colors">
          <span className="text-base">↗</span>
          Compartir
        </button>
      </div>

    </div>
  );
}