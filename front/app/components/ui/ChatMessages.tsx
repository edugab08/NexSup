'use client';

import { User, Headset } from 'lucide-react';

export type Mensagem = {
  id: string;
  texto: string;
  remetente: 'usuario' | 'suporte';
  hora: string;
  interna?: boolean;
};

export default function ChatMessages({ mensagens }: { mensagens: Mensagem[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 space-y-6">
      {mensagens.map((msg) => {
        const isSuporte = msg.remetente === 'suporte';
        return (
          <div key={msg.id} className={`flex gap-3 ${isSuporte ? 'justify-end' : 'justify-start'}`}>
            {!isSuporte && (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 border border-slate-700">
                <User size={16} />
              </div>
            )}
            <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
              msg.interna
                ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 rounded-tr-sm'
                : isSuporte
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
            }`}>
              {msg.interna && (
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                  Nota interna
                </span>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
              <span className={`text-[10px] mt-2 block text-right ${
                msg.interna ? 'text-yellow-500/70' : isSuporte ? 'text-blue-200' : 'text-slate-400'
              }`}>
                {msg.hora}
              </span>
            </div>
            {isSuporte && (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Headset size={16} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
