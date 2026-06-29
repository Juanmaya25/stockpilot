'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Package,
  AlertTriangle,
  Wallet,
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
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

/** Animated count-up number. */
function Counter({ value, format }: { value: number; format: (n: number) => string }) {
  const [n, setN] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const from = ref.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / 700, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="font-mono tabular-nums">{format(n)}</span>;
}

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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <header className="mb-8 in" style={{ animationDelay: '0ms' }}>
        <h1 className="font-display text-3xl font-semibold text-white">
          Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          Tu negocio en tiempo real, con un copiloto que entiende tus datos.
        </p>
      </header>

      {error && (
        <p className="text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {!data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi
              i={0}
              icon={Wallet}
              label="Valor de inventario"
              node={<Counter value={data.inventoryValue} format={money} />}
            />
            <Kpi
              i={1}
              icon={Package}
              label="Productos"
              node={<Counter value={data.totalProducts} format={(n) => String(Math.round(n))} />}
            />
            <Kpi
              i={2}
              icon={TrendingUp}
              label="Ventas del mes"
              node={<Counter value={data.monthRevenue} format={money} />}
              sub={`${data.monthSalesCount} ventas`}
            />
            <Kpi
              i={3}
              icon={AlertTriangle}
              label="Stock bajo"
              node={<Counter value={data.lowStockCount} format={(n) => String(Math.round(n))} />}
              sub="por reordenar"
              warn={data.lowStockCount > 0}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <section
              className="lg:col-span-2 glass rounded-2xl p-6 in"
              style={{ animationDelay: '260ms' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-medium text-white">Ventas · últimos 7 días</h2>
                <span className="text-xs text-emerald-400 bg-emerald-400/10 rounded-full px-2.5 py-1">
                  live
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesTrend} margin={{ left: -18, right: 6 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => d.slice(5)}
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(v) => [money(Number(v ?? 0)), 'Ingresos']}
                      contentStyle={{
                        background: '#0c0e14',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        color: '#fff',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                      cursor={{ stroke: 'rgba(52,211,153,0.3)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#34d399"
                      strokeWidth={2.5}
                      fill="url(#rev)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="glass rounded-2xl p-6 in" style={{ animationDelay: '340ms' }}>
              <h2 className="font-medium text-white mb-5">Más vendidos</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-slate-500 text-sm">Aún no hay ventas.</p>
              ) : (
                <ul className="space-y-4">
                  {data.topProducts.map((p, i) => {
                    const max = data.topProducts[0].unitsSold || 1;
                    return (
                      <li key={p.id}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-slate-200 truncate">{p.name}</span>
                          <span className="font-mono text-slate-400">{p.unitsSold}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                            style={{ width: `${(p.unitsSold / max) * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({
  i,
  icon: Icon,
  label,
  node,
  sub,
  warn,
}: {
  i: number;
  icon: LucideIcon;
  label: string;
  node: React.ReactNode;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div
      className="glass glass-hover rounded-2xl p-5 in"
      style={{ animationDelay: `${i * 70 + 60}ms` }}
    >
      <div
        className={`grid place-items-center size-10 rounded-xl mb-4 ${
          warn
            ? 'bg-amber-400/10 text-amber-400'
            : 'bg-emerald-400/10 text-emerald-400'
        }`}
      >
        <Icon className="size-5" />
      </div>
      <p className="text-2xl font-semibold text-white">{node}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
