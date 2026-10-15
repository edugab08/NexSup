'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '../lib/toast';
import { TicketPlus, ArrowLeft, Send } from 'lucide-react';
import { ticketsApi, departmentsApi, categoriesApi, TicketPriority, Department, Category } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const PRIORIDADES: { value: TicketPriority; label: string; cor: string }[] = [
  { value: 'BAIXA',   label: 'Baixa',   cor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'MEDIA',   label: 'Média',   cor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'ALTA',    label: 'Alta',    cor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'CRITICA', label: 'Crítica', cor: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

export default function NovoChamado() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIA');
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [departamentos, setDepartamentos] = useState<Department[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Carrega setores ao montar
  useEffect(() => {
    departmentsApi.listar()
      .then((deps) => setDepartamentos(deps.filter((d) => d.active)))
      .catch(() => {});
  }, []);

  // Quando muda o setor, recarrega as categorias daquele setor
  useEffect(() => {
    setCategoryId('');
    if (!departmentId) { setCategorias([]); return; }
    categoriesApi.listar(departmentId)
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [departmentId]);

  async function criarTicket() {
    if (title.trim().length < 5) {
      setErro('O título precisa ter pelo menos 5 caracteres.');
      return;
    }
    if (description.trim().length < 10) {
      setErro('Descreva o problema com pelo menos 10 caracteres.');
      return;
    }

    setErro('');
    setSalvando(true);
    try {
      await ticketsApi.criar({
        title,
        description,
        priority,
        departmentId: departmentId || undefined,
        categoryId: categoryId || undefined,
      });
      toast.success('Chamado aberto com sucesso! Nossa equipe já foi notificada.');
      router.push('/');
    } catch (err: any) {
      setErro(err.message || 'Falha ao abrir chamado. Tente novamente.');
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative font-sans">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors bg-slate-900 px-4 py-2 rounded-lg shadow-sm border border-slate-800 hover:bg-slate-800"
      >
        <ArrowLeft size={18} />
        Voltar para Dashboard
      </Link>

      <div className="w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden mt-20 md:mt-0 border border-slate-800">
        <div className="bg-slate-900 border-b border-slate-800 p-8 flex items-center gap-6">
          <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30">
            <TicketPlus size={36} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Abrir novo chamado</h2>
            <p className="text-slate-400 text-sm mt-1">
              Olá, <span className="text-slate-300 font-medium">{user?.name}</span>. Descreva seu problema abaixo.
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {erro && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-medium border border-red-500/20">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Assunto do problema</label>
            <input
              data-cy="input-titulo-chamado" /* <--- Injetado aqui */
              className="w-full border border-slate-800 p-4 rounded-xl text-white bg-slate-950 focus:bg-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600 disabled:opacity-50"
              placeholder="Ex: Sistema lento ao gerar relatórios"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErro(''); }}
              disabled={salvando}
            />
          </div>

          {/* Setor e categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Setor</label>
              <select
                className="w-full border border-slate-800 p-4 rounded-xl text-white bg-slate-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={salvando}
              >
                <option value="">Selecione (opcional)</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Categoria</label>
              <select
                className="w-full border border-slate-800 p-4 rounded-xl text-white bg-slate-950 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={salvando || !departmentId}
              >
                <option value="">{departmentId ? 'Selecione (opcional)' : 'Escolha um setor antes'}</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Descrição detalhada</label>
            <textarea
              data-cy="textarea-desc-chamado" /* <--- Injetado aqui */
              className="w-full border border-slate-800 p-4 rounded-xl text-white bg-slate-950 focus:bg-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-40 resize-none placeholder-slate-600 disabled:opacity-50"
              placeholder="Descreva o que está acontecendo com o máximo de detalhes..."
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErro(''); }}
              disabled={salvando}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Prioridade</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORIDADES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  disabled={salvando}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                    priority === p.value
                      ? p.cor + ' ring-1 ring-current'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              data-cy="btn-salvar-chamado" /* <--- Injetado aqui */
              onClick={criarTicket}
              disabled={salvando}
              className="w-full bg-blue-600 text-white p-5 rounded-xl hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-lg font-bold text-lg flex items-center justify-center gap-3 border border-blue-500/50"
            >
              <Send size={20} />
              {salvando ? 'Enviando para o suporte...' : 'Confirmar e Abrir Chamado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}