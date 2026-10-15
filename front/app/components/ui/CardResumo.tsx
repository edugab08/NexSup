import { ReactNode } from "react"

type CardResumoProps = {
  titulo: string
  valor: number
  icone?: ReactNode
  corBorda: string
}

export default function CardResumo({ titulo, valor, icone, corBorda }: CardResumoProps) {
  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${corBorda}`}>
      <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mb-2">
        {icone} {titulo}
      </p>
      <p className="text-3xl font-bold text-slate-800">{valor}</p>
    </div>
  )
}