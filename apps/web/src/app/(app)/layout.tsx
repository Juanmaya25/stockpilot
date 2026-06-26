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
} from 'lucide-react';
import { getToken, clearToken } from '@/lib/api';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
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

  if (!ready) return null;

  function logout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="w-60 shrink-0 bg-slate-950 text-slate-300 flex flex-col">
        <div className="flex items-center gap-2 px-5 h-16 text-white font-semibold border-b border-white/5">
          <span className="grid place-items-center size-8 rounded-lg bg-emerald-500 text-slate-950">
            <Package className="size-4" />
          </span>
          StockPilot
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-medium'
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-5 h-14 text-sm border-t border-white/5 hover:text-white transition"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
