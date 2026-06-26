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
      const res = await api.post<{ answer: string }>('/assistant/ask', {
        question,
      });
      setMessages((m) => [...m, { role: 'assistant', content: res.answer }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            e instanceof Error
              ? `⚠️ ${e.message}`
              : 'Ocurrió un error al consultar la IA.',
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
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="p-6 pb-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="size-6 text-emerald-500" /> Asistente IA
        </h1>
        <p className="text-slate-500">
          Pregunta en lenguaje natural sobre tu inventario y ventas.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10 space-y-6">
            <p>Prueba preguntando:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition"
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
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap text-sm ${
                m.role === 'user'
                  ? 'bg-emerald-500 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="size-4 animate-spin text-emerald-500" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="p-4 border-t border-slate-200 bg-white/60 backdrop-blur"
      >
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta…"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="size-12 grid place-items-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition disabled:opacity-50"
          >
            <Send className="size-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
