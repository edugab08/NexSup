'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from '../../lib/toast';
import { ticketsApi, Rating } from '../../lib/api';

type Props = {
  ticketId: string;
  ratingExistente?: Rating | null;
  podeAvaliar: boolean; // só o dono, e só se resolvido/fechado
  onAvaliado?: (r: Rating) => void;
};

export default function AvaliacaoChamado({ ticketId, ratingExistente, podeAvaliar, onAvaliado }: Props) {
  const [score, setScore] = useState(ratingExistente?.score ?? 0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState(ratingExistente?.comment ?? '');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(!!ratingExistente);

  async function enviar() {
    if (score < 1) { toast.error('Escolha de 1 a 5 estrelas.'); return; }
    setEnviando(true);
    try {
      const r = await ticketsApi.avaliar(ticketId, score, comentario || undefined);
      setEnviado(true);
      toast.success('Obrigado pela sua avaliação!');
      onAvaliado?.(r);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar avaliação.');
    } finally {
      setEnviando(false);
    }
  }

  // Já avaliado: mostra somente leitura
  if (enviado) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-300 mb-2">Sua avaliação</p>
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={20} className={n <= score ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'} />
          ))}
        </div>
        {comentario && <p className="text-sm text-slate-400 italic">"{comentario}"</p>}
      </div>
    );
  }

  if (!podeAvaliar) return null;

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
      <p className="text-sm font-semibold text-slate-300 mb-3">Como foi o atendimento?</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setScore(n)}
            disabled={enviando}
          >
            <Star
              size={28}
              className={`transition-colors ${(hover || score) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 hover:text-slate-500'}`}
            />
          </button>
        ))}
      </div>
      <textarea
        className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg p-3 outline-none focus:border-blue-500 resize-none h-20 placeholder-slate-600 mb-3"
        placeholder="Deixe um comentário (opcional)"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        disabled={enviando}
      />
      <button
        onClick={enviar}
        disabled={enviando || score < 1}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {enviando ? 'Enviando...' : 'Enviar avaliação'}
      </button>
    </div>
  );
}
