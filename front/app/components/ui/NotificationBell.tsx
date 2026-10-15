'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check } from 'lucide-react';
import { notificationsApi, Notification } from '../../lib/api';

export default function NotificationBell() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [itens, setItens] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Conta não lidas periodicamente
  useEffect(() => {
    let ativo = true;
    const buscar = () => {
      notificationsApi.contarNaoLidas()
        .then((r) => { if (ativo) setNaoLidas(r.count); })
        .catch(() => {});
    };
    buscar();
    const id = setInterval(buscar, 30_000); // a cada 30s
    return () => { ativo = false; clearInterval(id); };
  }, []);

  // Fecha ao clicar fora
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function abrir() {
    const novoEstado = !aberto;
    setAberto(novoEstado);
    if (novoEstado) {
      try {
        const lista = await notificationsApi.listar();
        setItens(lista);
      } catch { /* silencioso */ }
    }
  }

  async function marcarTodas() {
    await notificationsApi.marcarTodasLidas().catch(() => {});
    setNaoLidas(0);
    setItens((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function abrirNotificacao(n: Notification) {
    if (!n.read) {
      await notificationsApi.marcarLida(n.id).catch(() => {});
      setNaoLidas((c) => Math.max(0, c - 1));
    }
    setAberto(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={abrir}
        title="Notificações"
        className="relative text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
      >
        <Bell size={18} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-slate-800 sticky top-0 bg-slate-900">
            <span className="text-sm font-semibold text-white">Notificações</span>
            <button
              onClick={marcarTodas}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Check size={12} /> Marcar todas
            </button>
          </div>

          {itens.length === 0 ? (
            <p className="p-6 text-center text-slate-600 text-sm">Nenhuma notificação.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {itens.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => abrirNotificacao(n)}
                    className={`w-full text-left p-3 hover:bg-slate-800/60 transition-colors ${!n.read ? 'bg-blue-500/5' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{n.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {new Date(n.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
