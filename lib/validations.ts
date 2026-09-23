import { z } from "zod";

// ── Auth / Registration ──────────────────────────────────────────────

export const registroSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Password es requerido"),
});

export const privyUserSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().max(100).optional(),
});

export const walletSchema = z.object({
  stellarAddress: z.string().min(1, "Dirección requerida"),
  email: z.string().email("Email inválido").optional(),
});

// ── Posts ────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  contenido: z.string().min(1, "Contenido es requerido").max(2000),
  userEmail: z.string().email("Email inválido"),
});

// ── Products ─────────────────────────────────────────────────────────

// GET /api/products — no body needed, query validated via searchParams
export const productsQuerySchema = z.object({
  category: z.string().optional(),
  hairTypes: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

// ── Pagination ───────────────────────────────────────────────────────

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── Payments / Purchases ─────────────────────────────────────────────

export const pagoSchema = z.object({
  userEmail: z.string().email("Email inválido"),
  productName: z.string().min(1, "Nombre del producto requerido"),
  precioUSDC: z.number().min(0, "Precio debe ser positivo"),
  tokensGanados: z.number().int().min(0),
  paymentAsset: z.enum(["USDC", "XLM"]).default("USDC"),
  precioXLM: z.number().min(0).optional(),
  discountCode: z.string().optional(),
});

export const compraSchema = z.object({
  walletAddress: z.string().min(1, "Wallet requerido"),
  userEmail: z.string().email("Email inválido").optional(),
  productName: z.string().min(1, "Nombre del producto requerido"),
  precioUSDC: z.number().min(0),
  tokensGanados: z.number().int().min(0),
  stellarTxHash: z.string().min(1, "Hash de transacción requerido"),
});

// ── Tokens ───────────────────────────────────────────────────────────

export const tokenBalanceSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const canjearSchema = z.object({
  userEmail: z.string().email("Email inválido"),
  canjeType: z.enum(["DESCUENTO_5", "DESCUENTO_10", "DESCUENTO_20"]),
});

export const earnSchema = z.object({
  userEmail: z.string().email("Email inválido"),
  accion: z.enum(["post", "comentario", "resena", "perfil", "navegacion"]),
});

export const otorgarSchema = z.object({
  userEmail: z.string().email("Email inválido"),
  accion: z.string().min(1, "Acción requerida"),
});

// ── Discount ─────────────────────────────────────────────────────────

export const discountValidateSchema = z.object({
  code: z.string().min(1, "Código requerido"),
});

// ── Loyalty ──────────────────────────────────────────────────────────

export const loyaltyDiscountSchema = z.object({
  email: z.string().email("Email inválido"),
});

// ── User ─────────────────────────────────────────────────────────────

export const userMeSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const userUpdateSchema = z.object({
  nombre: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  rol: z.enum(["RIZADA", "MARCA", "ESTILISTA"]).optional(),
  tipoCabello: z.string().max(50).optional(),
});

export const userBalancesSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const userRewardsSchema = z.object({
  email: z.string().email("Email inválido"),
});

// ── Helper: validate request body ────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

type ZodSchema = z.ZodTypeAny;

/**
 * Parse and validate request body against a Zod schema.
 * Returns { data, error } — if error is set, it's a ready-to-return NextResponse.
 */
export async function validateBody<T extends ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T> | null; error: NextResponse | null }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Body inválido: se esperaba JSON" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return {
      data: null,
      error: NextResponse.json(
        { error: "Validación fallida", details: fieldErrors },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}

/**
 * Parse and validate URL search params against a Zod schema.
 */
export function validateSearchParams<T extends ZodSchema>(
  req: NextRequest,
  schema: T
): { data: z.infer<T> | null; error: NextResponse | null } {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return {
      data: null,
      error: NextResponse.json(
        { error: "Parámetros inválidos", details: fieldErrors },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}
