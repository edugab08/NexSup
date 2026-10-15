import { CheckCircle, MessageSquare } from "lucide-react"
import Link from "next/link" // <-- Não esqueça de importar o Link!

export type Ticket = {
  id: string // 1. Garanta que o ID aqui é string
  nome: string
  titulo: string
  mensagem: string
  status: "aberto" | "fechado"
}

type CardChamadoProps = {
  ticket: Ticket
  aoFechar: (id: string) => void // 2. O SEGREDO ESTÁ AQUI: Mude de 'number' para 'string'
}

export default function CardChamado({ ticket, aoFechar }: CardChamadoProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{ticket.titulo}</h3>
          <p className="text-sm text-slate-500 mt-1">
            Aberto por: <span className="font-medium text-slate-700">{ticket.nome}</span>
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          ticket.status === "aberto" 
            ? "bg-yellow-100 text-yellow-800" 
            : "bg-green-100 text-green-800"
        }`}>
          {ticket.status.toUpperCase()}
        </span>
      </div>
      
      <p className="text-slate-600 mt-2 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100 line-clamp-2">
        {ticket.mensagem}
      </p>
      
      {/* Área dos botões atualizada */}
      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
        <Link 
          href={`/chamado/${ticket.id}`}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors"
        >
          <MessageSquare size={18}/> Abrir Chat
        </Link>

        {ticket.status === "aberto" && (
          <button
            onClick={() => aoFechar(ticket.id)}
            className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 px-4 py-2 rounded-lg transition-colors"
          >
            <CheckCircle size={18}/> Marcar Resolvido
          </button>
        )}
      </div>
    </div>
  )
}