'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
import { api, setToken } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form;
      const res = await api.post<AuthResponse>(path, payload);
      setToken(res.accessToken);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 text-slate-100">
      {/* Brand side */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-600/20 via-slate-950 to-slate-950 border-r border-white/5">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <span className="grid place-items-center size-9 rounded-xl bg-emerald-500 text-slate-950">
            <Package className="size-5" />
          </span>
          StockPilot
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Inventario, ventas y un{' '}
            <span className="text-emerald-400">copiloto con IA</span>, en un
            solo lugar.
          </h1>
          <p className="text-slate-400 max-w-md">
            Gestiona productos y stock en tiempo real, registra ventas que
            descuentan inventario al instante y pregúntale a la IA qué reordenar.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          Multi-tenant · JWT · PostgreSQL · NestJS · Next.js
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden flex items-center gap-2 text-xl font-semibold justify-center">
            <span className="grid place-items-center size-9 rounded-xl bg-emerald-500 text-slate-950">
              <Package className="size-5" />
            </span>
            StockPilot
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'login'
                ? 'Ingresa a tu negocio'
                : 'Registra tu negocio en segundos'}
            </p>
          </div>

          {mode === 'register' && (
            <>
              <Field
                label="Tu nombre"
                value={form.name}
                onChange={update('name')}
                placeholder="Juan Maya"
              />
              <Field
                label="Nombre del negocio"
                value={form.businessName}
                onChange={update('businessName')}
                placeholder="Mi Tienda"
              />
            </>
          )}
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="owner@mitienda.com"
          />
          <Field
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={update('password')}
            placeholder="mínimo 8 caracteres"
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 transition disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>

          <p className="text-sm text-slate-400 text-center">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-emerald-400 hover:underline font-medium"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </form>
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
  placeholder?: string;
  onChange: (e: { target: { value: string } }) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        {...props}
        required
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition"
      />
    </label>
  );
}
