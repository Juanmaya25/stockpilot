'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Sparkles,
  LogOut,
  Boxes,
} from 'lucide-react';
import { getToken, clearToken } from '@/lib/api';
import { DEMO } from '@/lib/demo';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/ventas', label: 'Punto de venta', icon: ShoppingCart },
  { href: '/asistente', label: 'Asistente IA', icon: Sparkles },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace('/login');
    else setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="size-8 rounded-full border-2 border-white/10 border-t-emerald-400 animate-spin" />
      </div>
    );
  }

  function logout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen flex gap-0 p-3">
      <aside className="glass rounded-2xl w-60 shrink-0 flex flex-col p-3 sticky top-3 h-[calc(100vh-1.5rem)]">
        <div className="flex items-center gap-2.5 px-2 h-14">
          <span className="relative grid place-items-center size-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 glow">
            <Boxes className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold text-white">
            StockPilot
          </span>
          {DEMO && (
            <span className="ml-auto text-[10px] font-mono tracking-wider text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/20 rounded-full px-2 py-0.5">
              DEMO
            </span>
          )}
        </div>

        <nav className="flex-1 mt-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? 'text-white bg-gradient-to-r from-emerald-400/15 to-transparent'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-cyan-400" />
                )}
                <Icon
                  className={`size-4 ${active ? 'text-emerald-400' : ''}`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
