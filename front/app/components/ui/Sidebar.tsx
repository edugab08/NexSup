'use client';

import Link from 'next/link';
import { MessageSquare, LogOut, User as UserIcon, Plus } from 'lucide-react';
import { Ticket, TicketStatus, User } from '../../lib/api';

const STATUS_FILTROS: { value: TicketStatus | 'TODOS'; label: string }[] = [
  { value: 'ABERTO',       label: 'Em Aberto' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'RESOLVIDO',    label: 'Resolvidos' },
  { value: 'TODOS',        label: 'Todos' },
];

const STATUS_COR: Record<string, string> = {
  ABERTO:       'bg-yellow-500/10 text-yellow-400',
  EM_ANDAMENTO: 'bg-blue-500/10 text-blue-400',
  RESOLVIDO:    'bg-green-500/10 text-green-400',
  FECHADO:      'bg-slate-500/10 text-slate-400',
};

const PRIORIDADE_COR: Record<string, string> = {
  BAIXA:   'bg-emerald-500/20 text-emerald-400',
  MEDIA:   'bg-yellow-500/20 text-yellow-400',
  ALTA:    'bg-orange-500/20 text-orange-400',
  CRITICA: 'bg-red-500/20 text-red-400',
};

type SidebarProps = {
  tickets: Ticket[];
  carregando: boolean;
  filtroStatus: TicketStatus | 'TODOS';
  setFiltroStatus: (status: TicketStatus | 'TODOS') => void;
  user: User | null;
  onLogout: () => void;
  titulo?: string;
};

export function Sidebar({ tickets, carregando, filtroStatus, setFiltroStatus, user, onLogout, titulo = 'Fila de Atendimentos' }: SidebarProps) {
  const contadores: Record<string, number> = {
    ABERTO:       tickets.filter((t) => t.status === 'ABERTO').length,
    EM_ANDAMENTO: tickets.filter((t) => t.status === 'EM_ANDAMENTO').length,
    RESOLVIDO:    tickets.filter((t) => t.status === 'RESOLVIDO').length,
    FECHADO:      tickets.filter((t) => t.status === 'FECHADO').length,
    TODOS:        tickets.length,
  };

  const ticketsFiltrados = filtroStatus === 'TODOS'
    ? tickets
    : tickets.filter((t) => t.status === filtroStatus);

  return (
    <aside className="w-80 md:w-96 bg-slate-950 border-r border-slate-800 flex flex-col z-20 h-full">

      {/* Cabeçalho com info do usuário */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
              <UserIcon size={16} className="text-blue-400" />
            </div>
            <div>
              <p data-cy="nome-usuario" className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            data-cy="btn-logout" /* <--- Cypress: Botão de Sair */
            title="Sair"
            className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
          >
            <LogOut size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-500" />
            {titulo}
          </h2>
          <Link
            href="/novo-chamado"
            data-cy="btn-novo-chamado" /* <--- Cypress: Link para novo chamado */
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all font-medium"
          >
            <Plus size={14} />
            Novo
          </Link>
        </div>

        {/* Filtros de status */}
        <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {STATUS_FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroStatus(f.value)}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                filtroStatus === f.value
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label} ({contadores[f.value] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de chamados */}
      <div data-cy="lista-chamados" className="flex-1 overflow-y-auto p-4 space-y-2"> {/* <--- Cypress: Lista completa */}
        {carregando ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 animate-pulse flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-800 rounded w-1/2" />
                <div className="h-4 bg-slate-800 rounded-full w-16" />
              </div>
              <div className="h-3 bg-slate-800/80 rounded w-3/4" />
            </div>
          ))
        ) : ticketsFiltrados.length === 0 ? (
          <p className="text-center text-slate-600 text-sm mt-8">
            Nenhum chamado encontrado.
          </p>
        ) : (
          ticketsFiltrados.map((ticket) => (
            <Link href={`/chamado/${ticket.id}`} key={ticket.id}>
              <div className="p-4 rounded-xl cursor-pointer transition-all border bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700">
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="font-semibold text-white text-sm truncate pr-2">
                    {ticket.user?.name || 'Usuário'}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${STATUS_COR[ticket.status] || ''}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mb-2">{ticket.title}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORIDADE_COR[ticket.priority] || ''}`}>
                    {ticket.priority}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </aside>
  );
}

export default Sidebar;