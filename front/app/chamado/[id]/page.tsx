'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '../../lib/toast';
import { ticketsApi, Ticket, Rating } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../contexts/AuthContext';
import ChatHeader from '../../components/ui/ChatHeader';
import ChatMessages from '../../components/ui/ChatMessages';
import ChatInput from '../../components/ui/ChatInput';
import AvaliacaoChamado from '../../components/ui/AvaliacaoChamado';
import { Loader2 } from 'lucide-react';

export type Mensagem = {
  id: string;
  texto: string;
  remetente: 'usuario' | 'suporte';
  hora: string;
  interna?: boolean;
};

function horaDe(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function PaginaChamado() {
  const { user, isStaff } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [notaInterna, setNotaInterna] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // O lado da mensagem é definido por QUEM ABRIU o chamado (o dono/solicitante),
  // não pela role do autor. Assim, se um agente abre um chamado para si, as
  // mensagens dele aparecem como solicitante; quem responder atendendo aparece
  // do outro lado.
  const mapComentario = useCallback((c: any, donoId?: string): Mensagem => ({
    id: c.id,
    texto: c.content,
    remetente: c.author?.id === donoId ? 'usuario' : 'suporte',
    hora: horaDe(c.createdAt),
    interna: c.internal,
  }), []);

  const carregarComentarios = useCallback(async (donoId: string, descricao: string, criadoEm: string) => {
    try {
      const coments = await ticketsApi.listarComentarios(id);
      // A descrição inicial é sempre do solicitante (dono)
      const base: Mensagem = { id: 'descricao', texto: descricao, remetente: 'usuario', hora: horaDe(criadoEm) };
      setMensagens([base, ...coments.map((c) => mapComentario(c, donoId))]);
    } catch {
      setMensagens([{ id: 'descricao', texto: descricao, remetente: 'usuario', hora: horaDe(criadoEm) }]);
    }
  }, [id, mapComentario]);

  useEffect(() => {
    async function carregarDados() {
      try {
        const dados = await ticketsApi.buscar(id);
        setTicket(dados);
        await carregarComentarios(dados.userId, dados.description, dados.createdAt);
      } catch (err: any) {
        toast.error(err.message || 'Chamado não encontrado.');
        router.push('/');
      }
    }
    if (id) carregarDados();
  }, [id, router, carregarComentarios]);

  // ── Tempo real via WebSocket ────────────────────────────────────────────────
  // Entra na sala do chamado e escuta novos comentários / mudanças de status.
  useEffect(() => {
    if (!id || !ticket) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join-ticket', id);

    const onNewComment = (c: any) => {
      // Ignora o que este próprio usuário acabou de enviar (já está na tela),
      // evitando duplicar pelo id.
      setMensagens((prev) => {
        if (prev.some((m) => m.id === c.id)) return prev;
        return [...prev, mapComentario(c, ticket.userId)];
      });
    };

    const onTicketUpdated = (t: any) => {
      setTicket((prev) => (prev ? { ...prev, ...t } : prev));
    };

    socket.on('new-comment', onNewComment);
    socket.on('ticket-updated', onTicketUpdated);

    return () => {
      socket.emit('leave-ticket', id);
      socket.off('new-comment', onNewComment);
      socket.off('ticket-updated', onTicketUpdated);
    };
  }, [id, ticket?.userId, mapComentario]);

  async function resolver() {
    if (!ticket) return;
    setSalvando(true);
    try {
      await ticketsApi.atualizar(id, { status: 'RESOLVIDO' });
      setTicket((prev) => (prev ? { ...prev, status: 'RESOLVIDO' } : prev));
      toast.success('Chamado marcado como resolvido!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resolver chamado.');
    } finally {
      setSalvando(false);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const texto = novaMensagem.trim();
    if (!texto || enviando) return;

    setEnviando(true);
    try {
      const novo = await ticketsApi.comentar(id, texto, notaInterna);
      setMensagens((prev) => [...prev, mapComentario(novo, ticket?.userId)]);
      setNovaMensagem('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setEnviando(false);
    }
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span>Carregando atendimento...</span>
        </div>
      </div>
    );
  }

  const ehDono = ticket.userId === user?.id;
  const resolvidoOuFechado = ticket.status === 'RESOLVIDO' || ticket.status === 'FECHADO';
  const podeAvaliar = ehDono && resolvidoOuFechado && !ticket.rating;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 md:p-8 font-sans text-slate-200">
      <div className="w-full max-w-4xl flex flex-col h-[90vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        <ChatHeader ticket={ticket} onResolver={resolver} salvando={salvando} isAdmin={isStaff} />
        <ChatMessages mensagens={mensagens} />

        {/* Avaliação aparece para o dono quando resolvido */}
        {ehDono && resolvidoOuFechado && (
          <div className="px-6 pb-2 bg-slate-950">
            <AvaliacaoChamado
              ticketId={id}
              ratingExistente={ticket.rating}
              podeAvaliar={podeAvaliar}
              onAvaliado={(r: Rating) => setTicket((prev) => prev ? { ...prev, rating: r } : prev)}
            />
          </div>
        )}

        {/* Toggle de nota interna (só equipe) */}
        {isStaff && ticket.status !== 'FECHADO' && (
          <div className="px-6 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="checkbox"
              id="nota-interna"
              checked={notaInterna}
              onChange={(e) => setNotaInterna(e.target.checked)}
              className="accent-yellow-500"
            />
            <label htmlFor="nota-interna" className="text-xs text-slate-400 cursor-pointer">
              Nota interna (visível apenas para a equipe de suporte)
            </label>
          </div>
        )}

        <ChatInput
          novaMensagem={novaMensagem}
          setNovaMensagem={setNovaMensagem}
          onEnviar={enviar}
          status={ticket.status}
        />
      </div>
    </div>
  );
}
