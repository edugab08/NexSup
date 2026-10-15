'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './components/ui/Sidebar';
import PainelEstatisticas from './components/ui/PainelEstatisticas';
import { ticketsApi, Ticket, TicketStatus } from './lib/api';
import { useAuth } from './contexts/AuthContext';
import { toast } from './lib/toast';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, logout, isAdmin, carregando: authCarregando } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<TicketStatus | 'TODOS'>('TODOS');

  // Admin não usa esta tela — vai para o painel administrativo
  useEffect(() => {
    if (!authCarregando && isAdmin) {
      router.replace('/admin');
    }
  }, [authCarregando, isAdmin, router]);

  useEffect(() => {
    if (authCarregando || isAdmin) return;
    carregarTickets();
  }, [authCarregando, isAdmin, filtroStatus]);

  async function carregarTickets() {
    try {
      setCarregando(true);
      const filtros: Record<string, string> = filtroStatus !== 'TODOS' ? { status: filtroStatus } : {};
      const dados = await ticketsApi.listar(filtros);
      setTickets(dados);
    } catch (err: any) {
      toast.error('Erro ao carregar chamados: ' + (err.message || 'Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  if (authCarregando || isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div data-cy="dashboard-container" className="flex h-screen bg-slate-900 overflow-hidden font-sans">
      <Sidebar
        tickets={tickets}
        carregando={carregando}
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
        user={user}
        onLogout={logout}
        titulo="Meus Chamados"
      />
      <PainelEstatisticas tickets={tickets} titulo="Meu Painel" />
    </div>
  );
}
