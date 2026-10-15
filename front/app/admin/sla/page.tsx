'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '../../lib/toast';
import { ArrowLeft, Clock, Loader2, Save } from 'lucide-react';
import { slaApi, SlaPolicy, TicketPriority } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const PRIORIDADES: TicketPriority[] = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'];
const COR: Record<string, string> = {
  CRITICA: 'text-red-400', ALTA: 'text-orange-400', MEDIA: 'text-yellow-400', BAIXA: 'text-emerald-400',
};

// minutos → "Xh Ymin" legível
function fmt(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}

export default function SlaPage() {
  const { isAdmin, carregando: authCarregando } = useAuth();
  const router = useRouter();

  const [policies, setPolicies] = useState<Record<string, { response: number; resolution: number }>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    if (!authCarregando && !isAdmin) router.replace('/');
  }, [authCarregando, isAdmin, router]);

  useEffect(() => {
    if (authCarregando || !isAdmin) return;
    slaApi.listar()
      .then((lista: SlaPolicy[]) => {
        const map: any = {};
        for (const p of lista) map[p.priority] = { response: p.responseTimeMins, resolution: p.resolutionTimeMins };
        // garante todas as prioridades presentes
        for (const pr of PRIORIDADES) if (!map[pr]) map[pr] = { response: 240, resolution: 1440 };
        setPolicies(map);
      })
      .catch(() => toast.error('Erro ao carregar políticas de SLA'))
      .finally(() => setCarregando(false));
  }, [authCarregando, isAdmin]);

  function alterar(pr: string, campo: 'response' | 'resolution', valor: string) {
    const n = parseInt(valor, 10);
    setPolicies((prev) => ({ ...prev, [pr]: { ...prev[pr], [campo]: isNaN(n) ? 0 : n } }));
  }

  async function salvar(pr: string) {
    setSalvando(pr);
    try {
      await slaApi.salvar(pr, policies[pr].response, policies[pr].resolution);
      toast.success(`SLA de ${pr} salvo!`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar SLA');
    } finally {
      setSalvando(null);
    }
  }

  if (authCarregando || !isAdmin || carregando) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 size={32} className="text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-200">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 mb-8">
          <ArrowLeft size={18} /> Voltar ao painel
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
            <Clock size={24} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Políticas de SLA</h1>
            <p className="text-slate-400 text-sm">Prazos de resposta e resolução por prioridade</p>
          </div>
        </div>

        <div className="space-y-4 mt-8">
          {PRIORIDADES.map((pr) => (
            <div key={pr} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className={`font-bold ${COR[pr]}`}>{pr}</span>
                <button
                  onClick={() => salvar(pr)}
                  disabled={salvando === pr}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600/15 text-blue-300 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-600/30 transition-colors disabled:opacity-50"
                >
                  <Save size={13} /> {salvando === pr ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Tempo de resposta (min) · {fmt(policies[pr]?.response ?? 0)}</label>
                  <input
                    type="number" min={1}
                    value={policies[pr]?.response ?? ''}
                    onChange={(e) => alterar(pr, 'response', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Tempo de resolução (min) · {fmt(policies[pr]?.resolution ?? 0)}</label>
                  <input
                    type="number" min={1}
                    value={policies[pr]?.resolution ?? ''}
                    onChange={(e) => alterar(pr, 'resolution', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
