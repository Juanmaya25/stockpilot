'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '@/lib/api';
import type { DashboardOverview } from '@/lib/types';

const money = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<DashboardOverview>('/dashboard')
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500">Resumen de tu negocio en tiempo real.</p>
      </header>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {!data ? (
        <div className="text-slate-400">Cargando…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Kpi
              icon={DollarSign}
              label="Valor de inventario"
              value={money(data.inventoryValue)}
              tint="emerald"
            />
            <Kpi
              icon={Package}
              label="Productos"
              value={String(data.totalProducts)}
              tint="sky"
            />
            <Kpi
              icon={TrendingUp}
              label="Ventas del mes"
              value={money(data.monthRevenue)}
              sub={`${data.monthSalesCount} ventas`}
              tint="violet"
            />
            <Kpi
              icon={AlertTriangle}
              label="Stock bajo"
              value={String(data.lowStockCount)}
              sub="productos por reordenar"
              tint="amber"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold mb-4">Ventas últimos 7 días</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesTrend}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => d.slice(5)}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} width={40} />
                    <Tooltip
                      formatter={(v: number) => money(v)}
                      labelStyle={{ color: '#0f172a' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#rev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold mb-4">Más vendidos (7 días)</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-slate-400 text-sm">Aún no hay ventas.</p>
              ) : (
                <ul className="space-y-3">
                  {data.topProducts.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <span className="grid place-items-center size-7 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-sm">{p.name}</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {p.unitsSold}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

const tints: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
};

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tint: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div
        className={`grid place-items-center size-10 rounded-xl mb-3 ${tints[tint]}`}
      >
        <Icon className="size-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
