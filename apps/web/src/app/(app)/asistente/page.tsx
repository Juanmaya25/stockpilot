'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  '¿Qué productos debería reordenar?',
  '¿Cuál es mi producto más vendido?',
  '¿Cuánto vale mi inventario?',
  'Resume mis ventas del mes',
];

export default function AsistentePage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(q?: string) {
    const question = (q ?? input).trim();
    if (!question || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const res = await api.post<{ answer: string }>('/assistant/ask', { question });
      setMessages((m) => [...m, { role: 'assistant', content: res.answer }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            e instanceof Error ? `⚠️ ${e.message}` : 'Error al consultar la IA.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-1.5rem)] max-w-3xl mx-auto">
      <header className="p-6 pb-3 in">
        <h1 className="font-display text-3xl font-semibold text-white flex items-center gap-2.5">
          <span className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 glow">
            <Sparkles className="size-5" />
          </span>
          Asistente IA
        </h1>
        <p className="text-slate-400 mt-2">
          Pregunta en lenguaje natural sobre tu inventario y ventas.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-10 space-y-6 in">
            <p className="text-slate-500">Prueba preguntando:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="glass glass-hover rounded-full px-4 py-2 text-sm text-slate-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 font-medium rounded-br-sm'
                  : 'glass text-slate-200 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="size-4 animate-spin text-emerald-400" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="p-4">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta…"
            className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="size-12 grid place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 hover:opacity-90 transition disabled:opacity-40"
          >
            <Send className="size-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
