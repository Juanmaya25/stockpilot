'use client';

import { useEffect, useState } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, Check } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

interface CartLine {
  product: Product;
  qty: number;
}

const money = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(n);

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Product[]>('/products').then(setProducts).catch(() => {});
  }
  useEffect(load, []);

  function add(p: Product) {
    if (p.stock <= 0) return;
    setCart((c) => {
      const ex = c.find((l) => l.product.id === p.id);
      if (ex)
        return c.map((l) =>
          l.product.id === p.id
            ? { ...l, qty: Math.min(l.qty + 1, p.stock) }
            : l,
        );
      return [...c, { product: p, qty: 1 }];
    });
  }

  function changeQty(id: string, qty: number) {
    setCart((c) =>
      c
        .map((l) => (l.product.id === id ? { ...l, qty } : l))
        .filter((l) => l.qty > 0),
    );
  }

  const total = cart.reduce(
    (s, l) => s + Number(l.product.salePrice) * l.qty,
    0,
  );

  async function checkout() {
    if (cart.length === 0) return;
    setSaving(true);
    setMsg('');
    try {
      await api.post('/sales', {
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.qty })),
      });
      setCart([]);
      setMsg('✅ Venta registrada — el stock se actualizó');
      load();
      setTimeout(() => setMsg(''), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Punto de venta</h1>
        <p className="text-slate-500">
          Toca un producto para agregarlo a la venta.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => add(p)}
              disabled={p.stock <= 0}
              className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-400 hover:shadow-sm transition disabled:opacity-50"
            >
              <p className="font-medium truncate">{p.name}</p>
              <p className="text-sm text-slate-400">{p.sku}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold text-emerald-600">
                  {money(Number(p.salePrice))}
                </span>
                <span className="text-xs text-slate-400">stock {p.stock}</span>
              </div>
            </button>
          ))}
          {products.length === 0 && (
            <p className="text-slate-400 col-span-full">
              No hay productos. Crea algunos en la sección Productos.
            </p>
          )}
        </div>

        {/* Cart */}
        <aside className="bg-white rounded-2xl border border-slate-200 p-5 h-fit lg:sticky lg:top-8">
          <div className="flex items-center gap-2 font-semibold mb-4">
            <ShoppingCart className="size-5 text-emerald-600" /> Venta actual
          </div>

          {cart.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">
              Carrito vacío
            </p>
          ) : (
            <ul className="space-y-3 mb-4">
              {cart.map((l) => (
                <li key={l.product.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {l.product.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {money(Number(l.product.salePrice))} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeQty(l.product.id, l.qty - 1)}
                      className="size-6 grid place-items-center rounded border border-slate-200 hover:bg-slate-50"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{l.qty}</span>
                    <button
                      onClick={() =>
                        changeQty(
                          l.product.id,
                          Math.min(l.qty + 1, l.product.stock),
                        )
                      }
                      className="size-6 grid place-items-center rounded border border-slate-200 hover:bg-slate-50"
                    >
                      <Plus className="size-3" />
                    </button>
                    <button
                      onClick={() => changeQty(l.product.id, 0)}
                      className="size-6 grid place-items-center rounded text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-4">
            <span className="text-slate-500">Total</span>
            <span className="text-xl font-bold">{money(total)}</span>
          </div>

          <button
            onClick={checkout}
            disabled={cart.length === 0 || saving}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2.5 transition disabled:opacity-50"
          >
            <Check className="size-4" />
            {saving ? 'Procesando…' : 'Cobrar'}
          </button>

          {msg && (
            <p className="text-sm text-center mt-3 text-slate-600">{msg}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
