'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '../../lib/toast';
import { ArrowLeft, Users, ShieldCheck, User as UserIcon, Trash2, Loader2, UserPlus, X, UserCheck, UserX } from 'lucide-react';
import { usersApi, User, UserRole } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function GestaoUsuarios() {
  const { user: atual, isAdmin, carregando: authCarregando } = useAuth();
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [acao, setAcao] = useState<string | null>(null);

  // Formulário de novo usuário
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<UserRole>('USER');
  const [criando, setCriando] = useState(false);

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
      const lista = await usersApi.listar();
      setUsuarios(lista);
    } catch (err: any) {
      toast.error('Erro ao carregar usuários: ' + (err.message || 'Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  async function criarUsuario() {
    if (nome.trim().length < 2) { toast.error('Informe o nome.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error('E-mail inválido.'); return; }
    if (senha.length < 8) { toast.error('A senha precisa ter ao menos 8 caracteres.'); return; }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(senha)) { toast.error('A senha deve conter ao menos uma letra e um número.'); return; }

    setCriando(true);
    try {
      await usersApi.criar({ name: nome.trim(), email: email.trim(), password: senha, role: papel });
      toast.success(`Usuário criado como ${papel}!`);
      setNome(''); setEmail(''); setSenha(''); setPapel('USER'); setMostrarForm(false);
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário.');
    } finally {
      setCriando(false);
    }
  }

  async function mudarPapel(u: User, novoRole: UserRole) {
    if (novoRole === u.role) return;
    setAcao(u.id);
    try {
      await usersApi.atualizar(u.id, { role: novoRole });
      toast.success(`${u.name} agora é ${novoRole}`);
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar permissão.');
    } finally {
      setAcao(null);
    }
  }

  async function alternarAtivo(u: User) {
    setAcao(u.id);
    try {
      await usersApi.atualizar(u.id, { active: !u.active });
      toast.success(u.active ? `${u.name} foi desativado` : `${u.name} foi reativado`);
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar status.');
    } finally {
      setAcao(null);
    }
  }

  async function remover(u: User) {
    if (!confirm(`Remover ${u.name}? Esta ação não pode ser desfeita.`)) return;
    setAcao(u.id);
    try {
      await usersApi.remover(u.id);
      toast.success('Usuário removido.');
      await carregar();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover usuário.');
    } finally {
      setAcao(null);
    }
  }

  if (authCarregando || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-200">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 mb-8"
        >
          <ArrowLeft size={18} /> Voltar ao painel
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
              <Users size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gestão de Usuários</h1>
              <p className="text-slate-400 text-sm">Crie, promova ou remova contas do sistema</p>
            </div>
          </div>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            {mostrarForm ? <X size={16} /> : <UserPlus size={16} />}
            {mostrarForm ? 'Cancelar' : 'Novo usuário'}
          </button>
        </div>

        {/* Formulário de criação */}
        {mostrarForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
            <p className="text-sm font-semibold text-slate-300 mb-4">Criar novo usuário</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                className="bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500"
              />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500"
              />
              <input
                type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha (mín. 8, com letra e número)"
                className="bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500"
              />
              <select
                value={papel} onChange={(e) => setPapel(e.target.value as UserRole)}
                className="bg-slate-950 border border-slate-800 text-white rounded-lg p-3 outline-none focus:border-blue-500"
              >
                <option value="USER">Usuário (abre chamados)</option>
                <option value="AGENT">Agente (atende chamados)</option>
                <option value="ADMIN">Administrador (acesso total)</option>
              </select>
            </div>
            <button
              onClick={criarUsuario} disabled={criando}
              className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <UserPlus size={15} /> {criando ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {carregando ? (
            <div className="p-12 flex justify-center">
              <Loader2 size={28} className="text-blue-500 animate-spin" />
            </div>
          ) : usuarios.length === 0 ? (
            <p className="p-12 text-center text-slate-600">Nenhum usuário cadastrado.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {usuarios.map((u) => {
                const ehProprio = u.id === atual?.id;
                return (
                  <li key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg border ${u.role === 'ADMIN' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-slate-800 border-slate-700'}`}>
                        {u.role === 'ADMIN'
                          ? <ShieldCheck size={16} className="text-blue-400" />
                          : <UserIcon size={16} className="text-slate-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {u.name} {ehProprio && <span className="text-xs text-slate-500">(você)</span>}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {u.active === false && (
                        <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-red-500/10 text-red-400">
                          INATIVO
                        </span>
                      )}

                      {ehProprio ? (
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wider ${
                          u.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/40 text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      ) : (
                        <>
                          {/* Seletor de papel: USER / AGENT / ADMIN */}
                          <select
                            value={u.role}
                            onChange={(e) => mudarPapel(u, e.target.value as UserRole)}
                            disabled={acao === u.id}
                            className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer"
                          >
                            <option value="USER">Usuário</option>
                            <option value="AGENT">Agente</option>
                            <option value="ADMIN">Admin</option>
                          </select>

                          {/* Ativar / desativar conta */}
                          <button
                            onClick={() => alternarAtivo(u)}
                            disabled={acao === u.id}
                            title={u.active === false ? 'Reativar conta' : 'Desativar conta'}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              u.active === false
                                ? 'text-slate-500 hover:text-green-400 hover:bg-green-500/10'
                                : 'text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10'
                            }`}
                          >
                            {u.active === false ? <UserCheck size={15} /> : <UserX size={15} />}
                          </button>

                          <button
                            onClick={() => remover(u)}
                            disabled={acao === u.id}
                            title="Remover"
                            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
