'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '../../lib/toast';
import { ArrowLeft, Building2, Loader2, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { departmentsApi, usersApi, Department, User } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function SetoresPage() {
  const { isAdmin, carregando: authCarregando } = useAuth();
  const router = useRouter();

  const [setores, setSetores] = useState<Department[]>([]);
  const [agentes, setAgentes] = useState<User[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novoNome, setNovoNome] = useState('');
  const [novaDesc, setNovaDesc] = useState('');
  const [criando, setCriando] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Department | null>(null);

  useEffect(() => {
    if (!authCarregando && !isAdmin) router.replace('/');
  }, [authCarregando, isAdmin, router]);

  useEffect(() => {
    if (authCarregando || !isAdmin) return;
    carregar();
  }, [authCarregando, isAdmin]);

  async function carregar() {
    try {
      setCarregando(true);
      const [deps, ags] = await Promise.all([departmentsApi.listar(), usersApi.agentes()]);
      setSetores(deps);
      setAgentes(ags);
    } catch (err: any) {
      toast.error('Erro ao carregar setores: ' + (err.message || ''));
    } finally {
      setCarregando(false);
    }
  }

  async function criar() {
    if (novoNome.trim().length < 2) { toast.error('Nome muito curto.'); return; }
    setCriando(true);
    try {
      await departmentsApi.criar(novoNome.trim(), novaDesc.trim() || undefined);
      toast.success('Setor criado!');
      setNovoNome(''); setNovaDesc('');
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar setor');
    } finally {
      setCriando(false);
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover este setor?')) return;
    try {
      await departmentsApi.remover(id);
      toast.success('Setor removido.');
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover');
    }
  }

  async function abrirDetalhe(id: string) {
    if (expandido === id) { setExpandido(null); setDetalhe(null); return; }
    setExpandido(id);
    try {
      const d = await departmentsApi.buscar(id);
      setDetalhe(d);
    } catch { setDetalhe(null); }
  }

  async function addMembro(depId: string, userId: string) {
    try {
      await departmentsApi.addMembro(depId, userId);
      toast.success('Membro adicionado.');
      await abrirDetalhe(depId === expandido ? depId : depId); // recarrega detalhe
      const d = await departmentsApi.buscar(depId); setDetalhe(d);
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar membro');
    }
  }

  async function removerMembro(depId: string, userId: string) {
    try {
      await departmentsApi.removerMembro(depId, userId);
      const d = await departmentsApi.buscar(depId); setDetalhe(d);
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover membro');
    }
  }

  if (authCarregando || !isAdmin || carregando) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 size={32} className="text-blue-500 animate-spin" /></div>;
  }

  const idsMembros = new Set((detalhe?.members || []).map((m) => m.user.id));

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-200">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 mb-8">
          <ArrowLeft size={18} /> Voltar ao painel
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
            <Building2 size={24} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Setores</h1>
            <p className="text-slate-400 text-sm">Filas de atendimento e seus agentes</p>
          </div>
        </div>

        {/* Criar novo setor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-slate-300 mb-3">Novo setor</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              value={novoNome} onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome (ex: Suporte N1)"
              className="bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500"
            />
            <input
              value={novaDesc} onChange={(e) => setNovaDesc(e.target.value)}
              placeholder="Descrição (opcional)"
              className="bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={criar} disabled={criando}
            className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus size={15} /> {criando ? 'Criando...' : 'Criar setor'}
          </button>
        </div>

        {/* Lista de setores */}
        <div className="space-y-3">
          {setores.map((s) => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <button onClick={() => abrirDetalhe(s.id)} className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                  <p className="text-[11px] text-slate-600 mt-1">
                    {s._count?.tickets ?? 0} chamados · {s._count?.members ?? 0} membros
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => abrirDetalhe(s.id)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1">
                    {expandido === s.id ? 'Fechar' : 'Membros'}
                  </button>
                  <button onClick={() => remover(s.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Painel de membros */}
              {expandido === s.id && detalhe && (
                <div className="border-t border-slate-800 p-4 bg-slate-950/50">
                  <p className="text-xs font-semibold text-slate-400 mb-2">Membros do setor</p>
                  {(detalhe.members || []).length === 0 ? (
                    <p className="text-xs text-slate-600 mb-3">Nenhum membro ainda.</p>
                  ) : (
                    <ul className="space-y-1 mb-3">
                      {detalhe.members!.map((m) => (
                        <li key={m.user.id} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2">
                          <span className="text-sm text-white">{m.user.name} <span className="text-[10px] text-slate-500">({m.user.role})</span></span>
                          <button onClick={() => removerMembro(s.id, m.user.id)} className="text-slate-500 hover:text-red-400">
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="text-xs font-semibold text-slate-400 mb-2">Adicionar agente</p>
                  <div className="flex flex-wrap gap-2">
                    {agentes.filter((a) => !idsMembros.has(a.id)).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => addMembro(s.id, a.id)}
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                      >
                        <UserPlus size={12} /> {a.name}
                      </button>
                    ))}
                    {agentes.filter((a) => !idsMembros.has(a.id)).length === 0 && (
                      <span className="text-xs text-slate-600">Todos os agentes já estão neste setor.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
