'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Ticket } from '../../lib/api';

const STATUS_COR: Record<string, string> = {
  ABERTO:       'bg-yellow-500/10 text-yellow-400',
  EM_ANDAMENTO: 'bg-blue-500/10 text-blue-400',
  RESOLVIDO:    'bg-green-500/10 text-green-400',
  FECHADO:      'bg-slate-500/10 text-slate-400',
};

type Props = {
  ticket: Ticket;
  onResolver: () => void;
  salvando: boolean;
  isAdmin?: boolean;
};

export default function ChatHeader({ ticket, onResolver, salvando, isAdmin = false }: Props) {
  const podeResolver = isAdmin && ticket.status !== 'RESOLVIDO' && ticket.status !== 'FECHADO';
  const voltarPara = isAdmin ? '/admin' : '/';

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-4">
        <Link href={voltarPara} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-bold text-white text-base truncate max-w-[300px]">
            {ticket.title}
          </h1>
          <p className="text-xs text-slate-400">
            #{ticket.id.slice(0, 8)} · Aberto por {ticket.user?.name || 'Usuário'}
          </p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full tracking-wider ${STATUS_COR[ticket.status] || ''}`}>
          {ticket.status.replace('_', ' ')}
        </span>
        {podeResolver && (
          <button
            onClick={onResolver}
            disabled={salvando}
            className="bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold border border-green-600/30 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 size={16} />
            {salvando ? 'Resolvendo...' : 'Resolver'}
          </button>
        )}
      </div>
    </div>
  );
}
