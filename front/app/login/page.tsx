'use client';

import { useState } from 'react';
import { toast } from '../lib/toast';
import { LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Preencha e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      await login(email, password);
      toast.success('Bem-vindo de volta!');
    } catch (err: any) {
      toast.error(err.message || 'Credenciais inválidas. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4 mb-4">
            <ShieldCheck size={36} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">NexSupport</h1>
          <p className="text-slate-400 mt-2">Faça login para acessar o sistema</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                data-cy="input-email" /* <--- Cypress Selector Aqui */
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={carregando}
                placeholder="seu@email.com"
                className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 p-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                autoComplete="current-password"
                data-cy="input-senha" /* <--- Cypress Selector Aqui */
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={carregando}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 p-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              data-cy="btn-login" /* <--- Cypress Selector Aqui */
              disabled={carregando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold p-4 rounded-xl transition-all flex items-center justify-center gap-3 border border-blue-500/50 mt-2"
            >
              {carregando ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            Acesso restrito. Solicite uma conta ao administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}