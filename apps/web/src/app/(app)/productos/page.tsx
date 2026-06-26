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
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-slate-500">{products.length} en catálogo</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-4 py-2 transition"
        >
          <Plus className="size-4" /> Nuevo producto
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={create}
          className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <Input label="Nombre" value={form.name} onChange={set('name')} />
          <Input label="SKU" value={form.sku} onChange={set('sku')} />
          <Input label="Precio costo" type="number" value={form.costPrice} onChange={set('costPrice')} />
          <Input label="Precio venta" type="number" value={form.salePrice} onChange={set('salePrice')} />
          <Input label="Stock inicial" type="number" value={form.stock} onChange={set('stock')} />
          <Input label="Stock mínimo" type="number" value={form.minStock} onChange={set('minStock')} />
          <div className="flex items-end gap-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-4 py-2 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
            >
              <X className="size-4" /> Cancelar
            </button>
            {error && <span className="text-red-600 text-sm self-center">{error}</span>}
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Costo</th>
              <th className="px-4 py-3 font-medium">Venta</th>
              <th className="px-4 py-3 font-medium">Margen</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
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
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          low
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {p.stock}
                        {low && ' · bajo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">${p.costPrice}</td>
                    <td className="px-4 py-3 text-slate-500">${p.salePrice}</td>
                    <td className="px-4 py-3 text-slate-500">{margin}%</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => restock(p)}
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
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

function Input({
  label,
  hidden,
  ...props
}: {
  label: string;
  type?: string;
  value: string;
  hidden?: boolean;
  onChange: (e: { target: { value: string } }) => void;
}) {
  if (hidden) return null;
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-slate-600">{label}</span>
      <input
        {...props}
        required
        className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
  );
}
