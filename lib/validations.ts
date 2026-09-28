import { z } from "zod";

// Stellar ed25519 public keys are 56-char base32 strings starting with `G`.
const stellarAddressSchema = z
  .string()
  .regex(/^G[A-Z2-7]{55}$/, "Dirección Stellar inválida");

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

// Only product IDs and quantities are accepted. Prices and rewards are
// looked up from Prisma, never trusted from the body.
export const pagoSchema = z.object({
  userEmail: z.string().email("Email inválido"),
  productId: z.string().min(1, "Producto requerido").optional(),
  items: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().positive().max(999),
  })).min(1).max(100).optional(),
  paymentAsset: z.enum(["USDC", "XLM"]).default("USDC"),
  discountCode: z.string().optional(),
}).refine(data => data.items !== undefined || data.productId !== undefined, {
  message: "Productos requeridos", path: ["items"],
});

// ── Tokens ───────────────────────────────────────────────────────────

export const tokenBalanceSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const canjearSchema = z.object({
  canjeType: z.enum(["DESCUENTO_5", "DESCUENTO_10", "DESCUENTO_20"]),
});

export const earnSchema = z.object({
  accion: z.enum(["post", "comentario", "resena", "perfil", "navegacion"]),
});

export const otorgarSchema = z.object({
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
  email: z.string().email("Email inválido").optional(),
  id: z.string().min(1, "ID inválido").optional(),
}).refine((params) => params.email || params.id, {
  message: "Email o id requerido",
});

export const userUpdateSchema = z.object({
  nombre: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  rol: z.enum(["RIZADA", "MARCA", "ESTILISTA"]).optional(),
  tipoCabello: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const userBalancesSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const userRewardsSchema = z.object({
  email: z.string().email("Email inválido"),
});

// ── Reviews (multipart) ──────────────────────────────────────────────

/** Fields submitted as multipart/form-data to /api/products/[id]/reviews. */
export const productReviewFormSchema = z.object({
  rating: z.coerce
    .number()
    .int("Calificación inválida")
    .min(1, "Calificación mínima es 1")
    .max(5, "Calificación máxima es 5"),
  content: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  curlType: z.string().regex(/^[2-4][A-C]$/, "Tipo de rizo inválido"),
});

// ── Diagnóstico capilar ──────────────────────────────────────────────

export const diagnosticoSchema = z
  .object({
    hairType: z.string().max(50).optional(),
    curlPattern: z.string().max(50).optional(),
    porosity: z.string().max(50).optional(),
    thickness: z.string().max(50).optional(),
    length: z.string().max(50).optional(),
  })
  .refine(
    (params) =>
      Boolean(
        params.curlPattern ||
          params.hairType ||
          params.porosity ||
          params.thickness ||
          params.length
      ),
    { message: "Se requiere al menos un dato del perfil capilar" }
  );

// ── Credenciales (SBT) ───────────────────────────────────────────────

export const credentialRequestSchema = z.object({
  wallet: stellarAddressSchema,
  credentialType: z.enum([
    "curl_specialist",
    "natural_hair",
    "loc_stylist",
    "color_specialist",
  ]),
});

// ── Wallet auth (Accesly / Stellar) ──────────────────────────────────

export const walletChallengeSchema = z.object({
  stellarAddress: stellarAddressSchema,
  email: z.string().email("Email inválido").optional(),
});

export const walletVerifySchema = z.object({
  stellarAddress: stellarAddressSchema,
  nonce: z.string().min(16, "Nonce inválido"),
  signature: z.string().min(1, "Firma requerida"),
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
