'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, PackagePlus, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

const empty = {
  name: '',
  sku: '',
  costPrice: '',
  salePrice: '',
  stock: '',
  minStock: '',
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Product[]>('/products').then(setProducts).catch(() => {});
  }
  useEffect(load, []);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function create(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/products', {
        name: form.name,
        sku: form.sku,
        costPrice: Number(form.costPrice),
        salePrice: Number(form.salePrice),
        stock: Number(form.stock || 0),
        minStock: Number(form.minStock || 0),
      });
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function restock(p: Product) {
    const qty = window.prompt(`¿Cuántas unidades agregar a "${p.name}"?`, '10');
    if (!qty) return;
    await api.post(`/products/${p.id}/restock`, { quantity: Number(qty) });
    load();
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6 in">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">
            Productos
          </h1>
          <p className="text-slate-400 mt-1">{products.length} en catálogo</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold px-4 py-2.5 hover:opacity-90 transition"
        >
          <Plus className="size-4" /> Nuevo producto
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={create}
          className="glass rounded-2xl p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 in"
        >
          <Field label="Nombre" value={form.name} onChange={set('name')} />
          <Field label="SKU" value={form.sku} onChange={set('sku')} />
          <Field label="Precio costo" type="number" value={form.costPrice} onChange={set('costPrice')} />
          <Field label="Precio venta" type="number" value={form.salePrice} onChange={set('salePrice')} />
          <Field label="Stock inicial" type="number" value={form.stock} onChange={set('stock')} />
          <Field label="Stock mínimo" type="number" value={form.minStock} onChange={set('minStock')} />
          <div className="flex items-center gap-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold px-4 py-2 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-slate-300 hover:bg-white/[0.04] flex items-center gap-1"
            >
              <X className="size-4" /> Cancelar
            </button>
            {error && <span className="text-red-300 text-sm">{error}</span>}
          </div>
        </form>
      )}

      <div className="glass rounded-2xl overflow-hidden in">
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-left border-b border-white/[0.06]">
            <tr>
              <th className="px-5 py-3.5 font-medium">Producto</th>
              <th className="px-5 py-3.5 font-medium">SKU</th>
              <th className="px-5 py-3.5 font-medium">Stock</th>
              <th className="px-5 py-3.5 font-medium">Costo</th>
              <th className="px-5 py-3.5 font-medium">Venta</th>
              <th className="px-5 py-3.5 font-medium">Margen</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                  Aún no hay productos. Crea el primero.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const low = p.stock <= p.minStock;
                const margin =
                  Number(p.salePrice) > 0
                    ? Math.round(
                        ((Number(p.salePrice) - Number(p.costPrice)) /
                          Number(p.salePrice)) *
                          100,
                      )
                    : 0;
                return (
                  <tr key={p.id} className="hover:bg-white/[0.025] transition">
                    <td className="px-5 py-3.5 font-medium text-white">{p.name}</td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          low
                            ? 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20'
                            : 'bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20'
                        }`}
                      >
                        {p.stock}
                        {low && ' · bajo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">${p.costPrice}</td>
                    <td className="px-5 py-3.5 text-slate-300 font-mono">${p.salePrice}</td>
                    <td className="px-5 py-3.5 text-slate-400">{margin}%</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => restock(p)}
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        <PackagePlus className="size-4" /> Reabastecer
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-slate-400">{label}</span>
      <input
        {...props}
        required
        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition"
      />
    </label>
  );
}
