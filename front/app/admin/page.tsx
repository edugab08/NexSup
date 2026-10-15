'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '../lib/toast';
import {
  ShieldCheck, LogOut, Users, MessageSquare, Loader2,
  LayoutDashboard, Building2, Clock, BookOpen, Star, AlertTriangle,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ticketsApi, Ticket, TicketStatus, TicketStats } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/ui/NotificationBell';

const STATUS_FILTROS: { value: TicketStatus | 'TODOS'; label: string }[] = [
  { value: 'TODOS',        label: 'Todos' },
  { value: 'ABERTO',       label: 'Abertos' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'RESOLVIDO',    label: 'Resolvidos' },
  { value: 'FECHADO',      label: 'Fechados' },
];

const STATUS_COR: Record<string, string> = {
  ABERTO:       'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  EM_ANDAMENTO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  RESOLVIDO:    'bg-green-500/10 text-green-400 border-green-500/20',
  FECHADO:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const PRIORIDADE_COR: Record<string, string> = {
  BAIXA:   'bg-emerald-500/20 text-emerald-400',
  MEDIA:   'bg-yellow-500/20 text-yellow-400',
  ALTA:    'bg-orange-500/20 text-orange-400',
  CRITICA: 'bg-red-500/20 text-red-400',
};

const PROXIMO_STATUS: Record<string, TicketStatus | null> = {
  ABERTO:       'EM_ANDAMENTO',
  EM_ANDAMENTO: 'RESOLVIDO',
  RESOLVIDO:    'FECHADO',
  FECHADO:      null,
};

const ACAO_LABEL: Record<string, string> = {
  ABERTO:       'Iniciar atendimento',
  EM_ANDAMENTO: 'Marcar resolvido',
  RESOLVIDO:    'Fechar chamado',
};

export default function AdminPage() {
  const { user, logout, isAdmin, carregando: authCarregando } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<TicketStatus | 'TODOS'>('TODOS');
  const [atualizando, setAtualizando] = useState<string | null>(null);

  // Proteção client-side adicional (o middleware já barra no servidor)
  useEffect(() => {
    if (!authCarregando && !isAdmin) router.replace('/');
  }, [authCarregando, isAdmin, router]);

  useEffect(() => {
    if (authCarregando || !isAdmin) return;
    carregar();
  }, [authCarregando, isAdmin, filtroStatus]);

  async function carregar() {
    try {
      setCarregando(true);
      const filtros: Record<string, string> = filtroStatus !== 'TODOS' ? { status: filtroStatus } : {};
      const [lista, s] = await Promise.all([
        ticketsApi.listar(filtros),
        ticketsApi.stats().catch(() => null),
      ]);
      setTickets(lista);
      if (s) setStats(s);
    } catch (err: any) {
      toast.error('Erro ao carregar painel: ' + (err.message || 'Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  async function avancarStatus(ticket: Ticket) {
    const proximo = PROXIMO_STATUS[ticket.status];
    if (!proximo) return;
    setAtualizando(ticket.id);
    try {
      await ticketsApi.atualizar(ticket.id, { status: proximo });
      toast.success(`Chamado atualizado para ${proximo.replace('_', ' ')}`);
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar chamado.');
    } finally {
      setAtualizando(null);
    }
  }

  if (authCarregando || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  // Dados dos gráficos a partir das stats globais
  const dadosStatus = stats
    ? [
        { name: 'Em Aberto',    value: stats.aberto,      color: '#eab308' },
        { name: 'Em Andamento', value: stats.emAndamento, color: '#3b82f6' },
        { name: 'Resolvidos',   value: stats.resolvido,   color: '#22c55e' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div data-cy="dashboard-container" className="flex h-screen bg-slate-900 overflow-hidden font-sans">
      {/* ── Sidebar admin ───────────────────────────────────────────────── */}
      <aside className="w-80 md:w-96 bg-slate-950 border-r border-slate-800 flex flex-col z-20 h-full">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                <ShieldCheck size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-blue-400 font-medium">Administrador</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-500" />
              Todos os Chamados
            </h2>
            <Link
              href="/admin/usuarios"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all font-medium"
            >
              <Users size={14} />
              Usuários
            </Link>
          </div>

          {/* Filtros de status */}
          <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {STATUS_FILTROS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltroStatus(f.value)}
                className={`py-1.5 px-2.5 text-xs font-semibold rounded-md transition-all ${
                  filtroStatus === f.value
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de chamados com ações */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {carregando ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 animate-pulse h-24" />
            ))
          ) : tickets.length === 0 ? (
            <p className="text-center text-slate-600 text-sm mt-8">Nenhum chamado encontrado.</p>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 rounded-xl border bg-slate-900 border-slate-800 hover:border-slate-700 transition-all"
              >
                <Link href={`/chamado/${ticket.id}`}>
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-semibold text-white text-sm truncate pr-2">
                      {ticket.user?.name || 'Usuário'}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider border ${STATUS_COR[ticket.status] || ''}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mb-2">{ticket.title}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORIDADE_COR[ticket.priority] || ''}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </Link>
                {PROXIMO_STATUS[ticket.status] && (
                  <button
                    onClick={() => avancarStatus(ticket)}
                    disabled={atualizando === ticket.id}
                    className="w-full mt-1 text-xs font-semibold py-1.5 rounded-lg bg-blue-600/15 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-600/30 transition-colors disabled:opacity-50"
                  >
                    {atualizando === ticket.id ? 'Atualizando...' : ACAO_LABEL[ticket.status]}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Painel central ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-slate-900">
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-6 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard size={28} className="text-blue-500" />
            Painel Administrativo
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/admin/setores" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              <Building2 size={15} /> Setores
            </Link>
            <Link href="/admin/sla" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              <Clock size={15} /> SLA
            </Link>
            <Link href="/admin/base-conhecimento" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              <BookOpen size={15} /> Base
            </Link>
            <NotificationBell />
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full">
          {/* Cards de resumo (stats globais reais) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="Total" valor={stats?.total ?? 0} />
            <StatCard label="Abertos" valor={stats?.aberto ?? 0} cor="border-t-yellow-500" />
            <StatCard label="Em Andamento" valor={stats?.emAndamento ?? 0} cor="border-t-blue-500" />
            <StatCard label="Resolvidos" valor={stats?.resolvido ?? 0} cor="border-t-green-500" />
          </div>

          {/* Segunda linha: SLA e satisfação */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 border-t-4 border-t-red-500">
              <p className="text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-red-500" /> SLA de resposta violado
              </p>
              <p className="text-3xl font-bold text-white">{stats?.slaResponseBreaches ?? 0}</p>
            </div>
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 border-t-4 border-t-orange-500">
              <p className="text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-orange-500" /> SLA de resolução violado
              </p>
              <p className="text-3xl font-bold text-white">{stats?.slaResolutionBreaches ?? 0}</p>
            </div>
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 border-t-4 border-t-yellow-500">
              <p className="text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
                <Star size={13} className="text-yellow-500" /> Satisfação média
              </p>
              <p className="text-3xl font-bold text-white">
                {stats?.avgRating != null ? `${stats.avgRating} / 5` : '—'}
                <span className="text-sm text-slate-500 font-normal ml-2">({stats?.totalRatings ?? 0})</span>
              </p>
            </div>
          </div>

          {/* Gráfico de status */}
          <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 h-[350px] flex flex-col">
            <h3 className="text-slate-300 font-semibold mb-4 text-sm">Proporção por Status (global)</h3>
            <div className="flex-1 w-full">
              {dadosStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dadosStatus} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                      {dadosStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, valor, cor }: { label: string; valor: number; cor?: string }) {
  return (
    <div className={`bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 ${cor ? 'border-t-4 ' + cor : ''}`}>
      <p className="text-slate-400 text-xs font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{valor}</p>
    </div>
  );
}
