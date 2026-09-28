/* eslint-disable @typescript-eslint/no-require-imports -- This CommonJS test harness loads TypeScript and mocks server dependencies. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("ts-node").register({ transpileOnly: true, compilerOptions: { module: "CommonJS", moduleResolution: "node" } });

const storage = new Map();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
} });
global.window = { localStorage: globalThis.localStorage, addEventListener() {} };
const { useCartStore, catalogToCart } = require("../store/cartStore.ts");
const product = id => catalogToCart({ id, name: id, brandName: "Rizo", price: 10, tokenPrice: 5, imageUrl: null });

test("routines merge atomically, preserve existing products and persist quantities", () => {
  useCartStore.getState().clearCart();
  useCartStore.getState().addItem(product("existing"));
  let notifications = 0;
  const unsubscribe = useCartStore.subscribe(() => notifications++);
  useCartStore.getState().addItems([product("a"), product("b"), product("a")]);
  unsubscribe();
  assert.equal(notifications, 1);
  assert.deepEqual(useCartStore.getState().items.map(({ id, quantity }) => [id, quantity]), [["existing", 1], ["a", 2], ["b", 1]]);
  assert.equal(useCartStore.getState().items.reduce((sum, item) => sum + item.precioMXN * item.quantity, 0), 760);
  const saved = storage.get("cart-storage");
  useCartStore.getState().clearCart();
  storage.set("cart-storage", saved);
  useCartStore.persist.rehydrate();
  assert.equal(useCartStore.getState().items.length, 3);
  useCartStore.getState().updateQuantity("a", 3);
  useCartStore.getState().updateQuantity("a", NaN);
  useCartStore.getState().updateQuantity("a", -1);
  useCartStore.getState().updateQuantity("a", 1.5);
  assert.equal(useCartStore.getState().items.find(item => item.id === "a").quantity, 3);
  useCartStore.getState().updateQuantity("a", 0);
  useCartStore.getState().removeItem("b");
  assert.deepEqual(useCartStore.getState().items.map(item => item.id), ["existing"]);
  useCartStore.getState().setPagoExitoso({ txHash: "test", txOnChain: false, producto: "existing", precioMXN: 190, tokens: 5 });
  useCartStore.getState().clearCart();
  assert.equal(useCartStore.getState().items.length, 0);
  assert.equal(useCartStore.getState().pagoExitoso.txHash, "test");
});

test("legacy selected product migrates to a cart line", () => {
  storage.set("cart-storage", JSON.stringify({ version: 0, state: { productoSeleccionado: product("legacy") } }));
  useCartStore.persist.rehydrate();
  assert.deepEqual(useCartStore.getState().items, [product("legacy")]);
});

test("payment validates every quantity and accepts both cart and legacy requests", () => {
  const { pagoSchema } = require("../lib/validations.ts");
  const base = { userEmail: "test@example.com", precioUSDC: 20, tokensGanados: 10 };
  assert.equal(pagoSchema.safeParse({ ...base, items: [{ id: "a", quantity: 2 }, { id: "b", quantity: 1 }] }).success, true);
  assert.equal(pagoSchema.safeParse({ ...base, productId: "a" }).success, true);
  for (const quantity of [0, -1, 1.5, 1000]) {
    assert.equal(pagoSchema.safeParse({ ...base, items: [{ id: "a", quantity }] }).success, false);
  }
  assert.equal(pagoSchema.safeParse({ ...base, items: [] }).success, false);
  assert.equal(pagoSchema.safeParse(base).success, false);
});

test("checkout charges the catalog total once and records every purchased product", async () => {
  const Module = require("node:module");
  const originalLoad = Module._load;
  const purchases = [];
  const charges = [];
  const rewards = [];
  const catalog = [
    { id: "a", name: "Shampoo", price: 10, tokenPrice: 5 },
    { id: "b", name: "Gel", price: 20, tokenPrice: 8 },
  ];
  const transaction = {
    purchase: { update: async ({ where, data }) => { Object.assign(purchases.find(p => p.id === where.id), data); return purchases.find(p => p.id === where.id); } },
    user: { update: async ({ data }) => { rewards.push(data.tokens.increment); return { tokens: data.tokens.increment }; } },
    tokenTransaction: { create: async () => ({}) },
  };
  const mocks = {
    "next-auth": { getServerSession: async () => ({ user: { email: "test@example.com" } }) },
    "@/lib/auth": { authOptions: {} },
    "@/lib/db": { prisma: {
      user: { findUnique: async () => ({ id: "user", email: "test@example.com", stellarPublicKey: "public", stellarSecretKey: "secret" }) },
      purchase: { create: async ({ data }) => { const purchase = { id: `purchase-${purchases.length}`, ...data }; purchases.push(purchase); return purchase; } },
      product: { findMany: async ({ where }) => catalog.filter(product => where.id.in.includes(product.id)) },
      $transaction: async fn => fn(transaction),
    } },
    "@/lib/encryption": { decryptSecret: () => "secret" },
    "@/lib/email": { sendPurchaseConfirmationEmail: async () => {} },
    "@/lib/loyaltyContract": { checkDiscount: async () => 10, registerPurchase: async () => {} },
    "@/lib/rateLimit": { checkRateLimit: () => null },
    "@/lib/validations": require("../lib/validations.ts"),
    "@stellar/stellar-sdk": {
      Horizon: { Server: class { async loadAccount() { return {}; } async submitTransaction() { assert.equal(purchases[0].status, "PENDING"); return { hash: "confirmed" }; } } },
      Asset: class {},
      Keypair: { fromSecret: () => ({ publicKey: () => "public" }) },
      Networks: { TESTNET: "test" }, BASE_FEE: "100",
      Operation: { payment: payment => { charges.push(payment.amount); return payment; } },
      Memo: { text: value => value },
      TransactionBuilder: class {
        addOperation() { return this; } addMemo() { return this; } setTimeout() { return this; }
        build() { return { sign() {} }; }
      },
    },
  };
  let POST;
  Module._load = function(id, ...args) { return mocks[id] ?? originalLoad.call(this, id, ...args); };
  try { ({ POST } = require("../app/api/pago/route.ts")); }
  finally { Module._load = originalLoad; }
  const previousWallet = process.env.NEXT_PUBLIC_RIZO_WALLET_ADDRESS;
  process.env.NEXT_PUBLIC_RIZO_WALLET_ADDRESS = "test-destination";
  try {
    const response = await POST({ json: async () => ({
      userEmail: "test@example.com", items: [{ id: "a", quantity: 2 }, { id: "b", quantity: 3 }],
      precioUSDC: 0.01, tokensGanados: 99999,
    }) });
    assert.equal(response.status, 200);
    assert.deepEqual(charges, ["72.0000000"]);
    assert.equal(purchases.length, 1);
    assert.equal(purchases[0].status, "COMPLETED");
    assert.equal(purchases[0].stellarTxHash, "confirmed");
    assert.equal(purchases[0].precioUSDC, 72);
    assert.deepEqual(purchases[0].items, [
      { productId: "a", productName: "Shampoo", quantity: 2, unitPriceUSDC: 10, unitTokens: 5 },
      { productId: "b", productName: "Gel", quantity: 3, unitPriceUSDC: 20, unitTokens: 8 },
    ]);
    assert.deepEqual(rewards, [34]);
    assert.equal((await response.json()).tokensGanados, 34);
    const missing = await POST({ json: async () => ({ userEmail: "test@example.com", items: [{ id: "missing", quantity: 1 }], precioUSDC: 1, tokensGanados: 0 }) });
    assert.equal(missing.status, 404);
    assert.equal(charges.length, 1);
  } finally {
    if (previousWallet === undefined) delete process.env.NEXT_PUBLIC_RIZO_WALLET_ADDRESS;
    else process.env.NEXT_PUBLIC_RIZO_WALLET_ADDRESS = previousWallet;
  }
});
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

test("a fresh store restores the full cart after a page refresh", () => {
  useCartStore.getState().clearCart();
  useCartStore.getState().addItems([product("refresh-a"), { ...product("refresh-b"), quantity: 3 }]);
  delete require.cache[require.resolve("../store/cartStore.ts")];
  const refreshedStore = require("../store/cartStore.ts").useCartStore;
  assert.deepEqual(refreshedStore.getState().items.map(({ id, quantity }) => [id, quantity]), [["refresh-a", 1], ["refresh-b", 3]]);
  refreshedStore.getState().clearCart();
  delete require.cache[require.resolve("../store/cartStore.ts")];
  assert.deepEqual(require("../store/cartStore.ts").useCartStore.getState().items, []);
});

test("every library routine references products present in the seeded catalog", () => {
  const { getAllRutinas } = require("../lib/rutinas.ts");
  const seed = readFileSync(join(__dirname, "../prisma/seed.ts"), "utf8");
  const ids = new Set([...seed.matchAll(/name: "([^"]+)"/g)].map(([, name]) => name.toLowerCase().replace(/\s+/g, "-").slice(0, 25)));
  for (const routine of getAllRutinas()) {
    assert.ok(routine.productSlugs.length > 1, routine.id);
    for (const id of routine.productSlugs) assert.ok(ids.has(id), `${routine.id}: ${id}`);
  }
});
