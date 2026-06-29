'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Boxes, Loader2 } from 'lucide-react';
import { api, setToken } from '@/lib/api';
import { DEMO } from '@/lib/demo';
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

  function enterDemo() {
    setToken('demo-token');
    router.push('/');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login' ? { email: form.email, password: form.password } : form;
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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="hidden lg:flex flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 glow">
            <Boxes className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold text-white">
            StockPilot
          </span>
        </div>
        <div className="space-y-5 max-w-md">
          <h1 className="font-display text-5xl font-semibold leading-[1.05] text-white">
            Inventario y ventas con un{' '}
            <span className="text-grad">copiloto de IA</span>.
          </h1>
          <p className="text-slate-400 text-lg">
            Controla stock en tiempo real, cobra en segundos y pregúntale a la IA
            qué reordenar — todo en un solo lugar.
          </p>
        </div>
        <p className="text-sm text-slate-600 font-mono">
          multi-tenant · JWT · PostgreSQL · NestJS · Next.js
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="glass rounded-2xl p-8 w-full max-w-sm space-y-5">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-2">
            <span className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 glow">
              <Boxes className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold text-white">
              StockPilot
            </span>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-white">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'login'
                ? 'Ingresa a tu negocio'
                : 'Registra tu negocio en segundos'}
            </p>
          </div>

          {DEMO && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={enterDemo}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold py-2.5 hover:opacity-90 transition"
              >
                Entrar a la demo →
              </button>
              <p className="text-xs text-slate-500 text-center">
                Demo con datos de muestra en tu navegador. También puedes registrarte
                o entrar con cualquier dato.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="h-px flex-1 bg-white/10" /> o <span className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <>
              <Field label="Tu nombre" value={form.name} onChange={update('name')} placeholder="Juan Maya" />
              <Field label="Nombre del negocio" value={form.businessName} onChange={update('businessName')} placeholder="Mi Tienda" />
            </>
          )}
          <Field label="Email" type="email" value={form.email} onChange={update('email')} placeholder="owner@mitienda.com" />
          <Field label="Contraseña" type="password" value={form.password} onChange={update('password')} placeholder="mínimo 8 caracteres" />

          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-60"
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
        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition"
      />
    </label>
  );
}
