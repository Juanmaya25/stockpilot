/**
 * In-browser mock backend for the static GitHub Pages demo.
 *
 * When NEXT_PUBLIC_DEMO=1, lib/api.ts routes every call here instead of
 * hitting the real NestJS API. The data lives in memory (module scope), so it
 * persists across client-side navigation and resets on a full reload — exactly
 * what a public, no-backend demo wants. The real full-stack backend still lives
 * in the repo; this only powers the clickable showcase.
 */
import type {
  AuthResponse,
  DashboardOverview,
  Product,
  Sale,
  SaleItem,
} from './types';

export const DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

const DAY = 86_400_000;
const money = (n: number) => n.toFixed(2);
const iso = (t: number) => new Date(t).toISOString();
const ymd = (t: number) => new Date(t).toISOString().slice(0, 10);

// Tiny deterministic PRNG so the seeded demo looks identical on every load.
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1_103_515_245 + 12_345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

interface Store {
  products: Product[];
  sales: Sale[];
  seq: number;
}

const id = (store: Store, prefix: string) => `${prefix}_${(++store.seq).toString(36)}`;

const SEED_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'barcode' | 'category' | 'supplierId'>[] = [
  { name: 'Café en grano 1kg', sku: 'CAF-1KG', costPrice: '8.50', salePrice: '15.00', stock: 42, minStock: 10 },
  { name: 'Té verde · caja 20', sku: 'TE-VRD-20', costPrice: '3.20', salePrice: '6.50', stock: 8, minStock: 12 },
  { name: 'Azúcar 1kg', sku: 'AZU-1KG', costPrice: '1.10', salePrice: '2.50', stock: 120, minStock: 30 },
  { name: 'Leche entera 1L', sku: 'LCH-1L', costPrice: '0.90', salePrice: '1.80', stock: 64, minStock: 24 },
  { name: 'Galletas surtidas', sku: 'GAL-SUR', costPrice: '2.40', salePrice: '5.00', stock: 5, minStock: 15 },
  { name: 'Agua mineral 600ml', sku: 'AGU-600', costPrice: '0.40', salePrice: '1.20', stock: 210, minStock: 48 },
  { name: 'Chocolate barra 90g', sku: 'CHO-90', costPrice: '1.80', salePrice: '3.90', stock: 16, minStock: 20 },
  { name: 'Servilletas · pack', sku: 'SRV-PK', costPrice: '1.50', salePrice: '3.20', stock: 38, minStock: 10 },
];

function buildStore(): Store {
  const store: Store = { products: [], sales: [], seq: 0 };
  const now = Date.now();

  store.products = SEED_PRODUCTS.map((p, i) => ({
    ...p,
    id: `p_${i + 1}`,
    barcode: null,
    category: null,
    supplierId: null,
    createdAt: iso(now - (30 - i) * DAY),
  }));
  store.seq = store.products.length;

  // A week of sales, weighted toward the popular items, to drive the trend
  // chart and the "top products" list with believable numbers.
  const rnd = lcg(20260629);
  const weights = [5, 2, 3, 4, 2, 6, 3, 3]; // café & agua sell most
  const pool: number[] = [];
  weights.forEach((w, idx) => {
    for (let k = 0; k < w; k++) pool.push(idx);
  });

  for (let d = 6; d >= 0; d--) {
    const salesToday = 2 + Math.floor(rnd() * 3); // 2–4 sales/day
    for (let s = 0; s < salesToday; s++) {
      const lines = 1 + Math.floor(rnd() * 2); // 1–2 items
      const items: SaleItem[] = [];
      let total = 0;
      const used = new Set<number>();
      for (let l = 0; l < lines; l++) {
        const pi = pool[Math.floor(rnd() * pool.length)];
        if (used.has(pi)) continue;
        used.add(pi);
        const prod = store.products[pi];
        const qty = 1 + Math.floor(rnd() * 3);
        const unit = Number(prod.salePrice);
        const subtotal = unit * qty;
        total += subtotal;
        items.push({
          id: id(store, 'si'),
          quantity: qty,
          unitPrice: money(unit),
          subtotal: money(subtotal),
          productId: prod.id,
          product: prod,
        });
      }
      if (items.length === 0) continue;
      const t = now - d * DAY - Math.floor(rnd() * DAY * 0.8);
      store.sales.push({
        id: id(store, 'sale'),
        total: money(total),
        createdAt: iso(t),
        items,
      });
    }
  }

  return store;
}

let store = buildStore();

function productById(pid: string) {
  return store.products.find((p) => p.id === pid);
}

function dashboard(): DashboardOverview {
  const now = Date.now();
  const monthAgo = now - 30 * DAY;
  const monthSales = store.sales.filter((s) => new Date(s.createdAt).getTime() >= monthAgo);

  const inventoryValue = store.products.reduce(
    (sum, p) => sum + Number(p.costPrice) * p.stock,
    0,
  );
  const lowStockCount = store.products.filter((p) => p.stock <= p.minStock).length;
  const monthRevenue = monthSales.reduce((sum, s) => sum + Number(s.total), 0);

  // last 7 days trend
  const trendMap = new Map<string, number>();
  for (let d = 6; d >= 0; d--) trendMap.set(ymd(now - d * DAY), 0);
  for (const s of monthSales) {
    const key = ymd(new Date(s.createdAt).getTime());
    if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + Number(s.total));
  }
  const salesTrend = [...trendMap.entries()].map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));

  // top products (units sold, 30d)
  const units = new Map<string, number>();
  for (const s of monthSales)
    for (const it of s.items)
      units.set(it.productId, (units.get(it.productId) ?? 0) + it.quantity);
  const topProducts = [...units.entries()]
    .map(([pid, unitsSold]) => ({
      id: pid,
      name: productById(pid)?.name ?? '—',
      unitsSold,
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  return {
    totalProducts: store.products.length,
    inventoryValue: Math.round(inventoryValue * 100) / 100,
    lowStockCount,
    monthSalesCount: monthSales.length,
    monthRevenue: Math.round(monthRevenue * 100) / 100,
    salesTrend,
    topProducts,
  };
}

function createProduct(body: Record<string, unknown>): Product {
  const exists = store.products.some((p) => p.sku === String(body.sku));
  if (exists) throw new Error('Ya existe un producto con ese SKU');
  const prod: Product = {
    id: id(store, 'p'),
    name: String(body.name),
    sku: String(body.sku),
    barcode: null,
    category: null,
    costPrice: money(Number(body.costPrice) || 0),
    salePrice: money(Number(body.salePrice) || 0),
    stock: Number(body.stock) || 0,
    minStock: Number(body.minStock) || 0,
    supplierId: null,
    createdAt: iso(Date.now()),
  };
  store.products.unshift(prod);
  return prod;
}

function restock(pid: string, quantity: number): Product {
  const prod = productById(pid);
  if (!prod) throw new Error('Producto no encontrado');
  prod.stock += Math.max(0, quantity);
  return prod;
}

function createSale(body: { items: { productId: string; quantity: number }[] }): Sale {
  if (!body.items?.length) throw new Error('La venta no tiene productos');
  const items: SaleItem[] = [];
  let total = 0;
  for (const line of body.items) {
    const prod = productById(line.productId);
    if (!prod) throw new Error('Producto no encontrado');
    if (prod.stock < line.quantity)
      throw new Error(`Stock insuficiente de ${prod.name}`);
    const unit = Number(prod.salePrice);
    const subtotal = unit * line.quantity;
    total += subtotal;
    items.push({
      id: id(store, 'si'),
      quantity: line.quantity,
      unitPrice: money(unit),
      subtotal: money(subtotal),
      productId: prod.id,
      product: prod,
    });
  }
  // commit stock
  for (const line of body.items) {
    const prod = productById(line.productId)!;
    prod.stock -= line.quantity;
  }
  const sale: Sale = {
    id: id(store, 'sale'),
    total: money(total),
    createdAt: iso(Date.now()),
    items,
  };
  store.sales.unshift(sale);
  return sale;
}

function assistant(question: string): { answer: string } {
  const q = question.toLowerCase();
  const d = dashboard();
  const fmt = (n: number) => `US$${n.toFixed(2)}`;
  const low = store.products.filter((p) => p.stock <= p.minStock);

  let answer: string;
  if (/(reorden|reabast|bajo|comprar|pedir)/.test(q)) {
    answer = low.length
      ? `Deberías reordenar ${low.length} producto(s) en stock bajo:\n` +
        low.map((p) => `• ${p.name} — ${p.stock} uds (mínimo ${p.minStock})`).join('\n')
      : 'Ningún producto está por debajo de su stock mínimo. Todo en orden ✅';
  } else if (/(más vendido|mas vendido|top|popular)/.test(q)) {
    const t = d.topProducts[0];
    answer = t
      ? `Tu producto más vendido es ${t.name} con ${t.unitsSold} unidades en los últimos 30 días.`
      : 'Aún no hay ventas registradas.';
  } else if (/(inventario|vale|valor|cuánto.*stock|cuanto.*stock)/.test(q)) {
    answer = `El valor de tu inventario a costo es ${fmt(d.inventoryValue)}, repartido en ${d.totalProducts} productos.`;
  } else if (/(venta|ingreso|mes|resum|facturad)/.test(q)) {
    answer = `En los últimos 30 días registraste ${d.monthSalesCount} ventas por ${fmt(d.monthRevenue)}. Tu producto estrella es ${d.topProducts[0]?.name ?? '—'}.`;
  } else {
    answer =
      `Tu negocio tiene ${d.totalProducts} productos por un valor de ${fmt(d.inventoryValue)}. ` +
      `En 30 días: ${d.monthSalesCount} ventas (${fmt(d.monthRevenue)}). ` +
      (low.length ? `Atención: ${low.length} producto(s) en stock bajo.` : 'Sin alertas de stock.') +
      `\n\n(Demo: respuesta calculada sobre tus datos locales. En la app real responde un LLM vía Groq.)`;
  }
  return { answer };
}

/** Mirrors lib/api.ts request(): same paths, same response shapes. */
export async function demoRequest<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  // Small artificial latency so loading states are visible, like a real API.
  await new Promise((r) => setTimeout(r, 180 + Math.random() * 220));

  const b = (body ?? {}) as Record<string, unknown>;

  if (path === '/auth/login' || path === '/auth/register') {
    // Any credentials land in the seeded demo tenant so there's data to show.
    const res: AuthResponse = {
      accessToken: 'demo-token',
      user: {
        id: 'demo-user',
        email: typeof b.email === 'string' && b.email ? b.email : 'demo@stockpilot.dev',
        businessId: 'demo-biz',
        role: 'OWNER',
      },
    };
    return res as T;
  }

  if (path === '/dashboard') return dashboard() as T;
  if (path === '/products' && method === 'GET') return store.products as T;
  if (path === '/products' && method === 'POST') return createProduct(b) as T;

  const restockMatch = path.match(/^\/products\/([^/]+)\/restock$/);
  if (restockMatch && method === 'POST')
    return restock(restockMatch[1], Number(b.quantity) || 0) as T;

  if (path === '/sales' && method === 'POST')
    return createSale(b as { items: { productId: string; quantity: number }[] }) as T;

  if (path === '/assistant/ask' && method === 'POST')
    return assistant(String(b.question ?? '')) as T;

  throw new Error(`Demo: ruta no simulada (${method} ${path})`);
}

/** Resets the demo to its seeded state (used by the "reset" affordance). */
export function resetDemo() {
  store = buildStore();
}
