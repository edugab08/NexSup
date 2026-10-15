'use client';

import { TicketPlus, BarChart3, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Ticket } from '../../lib/api';

type Props = {
  tickets: Ticket[];
  titulo?: string;
};

export default function PainelEstatisticas({ tickets, titulo = 'Workspace' }: Props) {
  const total       = tickets.length;
  const abertos     = tickets.filter((t) => t.status === 'ABERTO').length;
  const andamento   = tickets.filter((t) => t.status === 'EM_ANDAMENTO').length;
  const resolvidos  = tickets.filter((t) => t.status === 'RESOLVIDO').length;

  const dadosStatus = [
    { name: 'Em Aberto',    value: abertos,   color: '#eab308' },
    { name: 'Em Andamento', value: andamento,  color: '#3b82f6' },
    { name: 'Resolvidos',   value: resolvidos, color: '#22c55e' },
  ].filter((d) => d.value > 0);

  // Agrupa chamados por dia da semana (últimos 7 dias)
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hoje = new Date();
  const dadosSemana = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - (6 - i));
    const chamadosDia = tickets.filter((t) => {
      const d = new Date(t.createdAt);
      return d.toDateString() === dia.toDateString();
    }).length;
    return { dia: diasSemana[dia.getDay()], chamados: chamadosDia };
  });

  return (
    <main className="flex-1 flex flex-col overflow-y-auto relative bg-slate-900">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-6 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 size={28} className="text-blue-500" />
          {titulo}
        </h1>
        <Link
          href="/novo-chamado"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg transition-all font-semibold text-sm"
        >
          <TicketPlus size={18} /> Novo Chamado
        </Link>
      </header>

      <div className="p-8 max-w-6xl mx-auto w-full">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
            <p className="text-slate-400 text-xs font-medium mb-2">Total</p>
            <p className="text-3xl font-bold text-white">{total}</p>
          </div>
          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 border-t-4 border-t-yellow-500">
            <p className="text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
              <AlertCircle size={13} className="text-yellow-500" /> Abertos
            </p>
            <p className="text-3xl font-bold text-white">{abertos}</p>
          </div>
          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 border-t-4 border-t-blue-500">
            <p className="text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-blue-500" /> Em Andamento
            </p>
            <p className="text-3xl font-bold text-white">{andamento}</p>
          </div>
          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 border-t-4 border-t-green-500">
            <p className="text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-green-500" /> Resolvidos
            </p>
            <p className="text-3xl font-bold text-white">{resolvidos}</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 h-[350px] flex flex-col">
            <h3 className="text-slate-300 font-semibold mb-4 text-sm">Proporção por Status</h3>
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

          <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 h-[350px] flex flex-col">
            <h3 className="text-slate-300 font-semibold mb-4 text-sm">Volume dos Últimos 7 Dias</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosSemana}>
                  <XAxis dataKey="dia" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} hide />
                  <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="chamados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
