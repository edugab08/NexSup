'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '../../lib/toast';
import { ArrowLeft, BookOpen, Loader2, Plus, Eye, Trash2, Globe, FileText } from 'lucide-react';
import { kbApi, KbArticle } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function BaseConhecimentoPage() {
  const { isStaff, isAdmin, carregando: authCarregando } = useAuth();
  const router = useRouter();

  const [artigos, setArtigos] = useState<KbArticle[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criandoNovo, setCriandoNovo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [publicado, setPublicado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!authCarregando && !isStaff) router.replace('/');
  }, [authCarregando, isStaff, router]);

  useEffect(() => {
    if (authCarregando || !isStaff) return;
    carregar();
  }, [authCarregando, isStaff]);

  async function carregar() {
    try {
      setCarregando(true);
      setArtigos(await kbApi.listar());
    } catch (err: any) {
      toast.error('Erro ao carregar artigos: ' + (err.message || ''));
    } finally {
      setCarregando(false);
    }
  }

  async function criar() {
    if (titulo.trim().length < 3) { toast.error('Título muito curto.'); return; }
    if (conteudo.trim().length < 10) { toast.error('Conteúdo muito curto.'); return; }
    setSalvando(true);
    try {
      await kbApi.criar(titulo.trim(), conteudo.trim(), publicado);
      toast.success('Artigo criado!');
      setTitulo(''); setConteudo(''); setPublicado(false); setCriandoNovo(false);
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar artigo');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarPublicacao(a: KbArticle) {
    try {
      await kbApi.atualizar(a.id, { published: !a.published });
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover este artigo?')) return;
    try {
      await kbApi.remover(id);
      toast.success('Artigo removido.');
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover');
    }
  }

  if (authCarregando || !isStaff || carregando) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 size={32} className="text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-200">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 mb-8">
          <ArrowLeft size={18} /> Voltar ao painel
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
              <BookOpen size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Base de Conhecimento</h1>
              <p className="text-slate-400 text-sm">Artigos de ajuda e FAQ</p>
            </div>
          </div>
          <button
            onClick={() => setCriandoNovo((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} /> Novo artigo
          </button>
        </div>

        {/* Formulário de novo artigo */}
        {criandoNovo && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 space-y-3">
            <input
              value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do artigo"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500"
            />
            <textarea
              value={conteudo} onChange={(e) => setConteudo(e.target.value)}
              placeholder="Conteúdo (suporta Markdown)"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500 h-40 resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} className="accent-blue-500" />
                Publicar imediatamente
              </label>
              <button
                onClick={criar} disabled={salvando}
                className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar artigo'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de artigos */}
        {artigos.length === 0 ? (
          <p className="text-center text-slate-600 py-12">Nenhum artigo ainda.</p>
        ) : (
          <div className="space-y-3">
            {artigos.map((a) => (
              <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">{a.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${a.published ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/40 text-slate-400'}`}>
                        {a.published ? 'PUBLICADO' : 'RASCUNHO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{a.content}</p>
                    <p className="text-[11px] text-slate-600 mt-2 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Eye size={11} /> {a.views}</span>
                      {a.author && <span>por {a.author.name}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => alternarPublicacao(a)}
                      title={a.published ? 'Despublicar' : 'Publicar'}
                      className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
                    >
                      {a.published ? <FileText size={15} /> : <Globe size={15} />}
                    </button>
                    {isAdmin && (
                      <button onClick={() => remover(a.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
