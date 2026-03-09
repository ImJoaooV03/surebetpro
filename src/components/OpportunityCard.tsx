import React from 'react';
import { TrendingUp, Plus, Info, Calculator, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface OpportunityCardProps {
  id: string;
  roi: number;
  sport: string;
  date: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  legs: {
    id: string;
    bookmaker: string;
    outcome: string;
    price: number;
  }[];
  onCalculate: (id: string) => void;
}

export function OpportunityCardSkeleton() {
  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-5 w-full animate-pulse flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-[#27272a] rounded-full"></div>
        <div className="h-5 w-36 bg-[#27272a] rounded-md"></div>
      </div>
      <div className="flex gap-3 mt-2">
        <div className="h-4 w-20 bg-[#27272a] rounded"></div>
        <div className="h-4 w-32 bg-[#27272a] rounded"></div>
      </div>
      <div className="h-5 w-40 bg-[#27272a] rounded mt-1"></div>
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#27272a]"></div>
          <div className="h-6 w-48 bg-[#27272a] rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#27272a]"></div>
          <div className="h-6 w-56 bg-[#27272a] rounded"></div>
        </div>
      </div>
      <div className="flex flex-col gap-3 mt-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-64 bg-[#27272a] rounded"></div>
          <div className="h-8 w-16 bg-[#27272a] rounded-lg"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 w-64 bg-[#27272a] rounded"></div>
          <div className="h-8 w-16 bg-[#27272a] rounded-lg"></div>
        </div>
      </div>
      <div className="h-10 w-full bg-[#27272a] rounded-xl mt-2"></div>
      <div className="flex gap-3 mt-1">
        <div className="h-12 flex-1 bg-[#27272a] rounded-xl"></div>
        <div className="h-12 flex-1 bg-[#27272a] rounded-xl"></div>
      </div>
    </div>
  );
}

export function OpportunityCard({
  id,
  roi,
  sport,
  date,
  league,
  homeTeam,
  awayTeam,
  legs,
  onCalculate
}: OpportunityCardProps) {
  
  // Helper para pegar as iniciais dos times
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const formattedDate = date 
    ? format(new Date(date), "dd/MM/yyyy, HH:mm", { locale: ptBR })
    : '--/--/----, --:--';

  return (
    <article 
      className="bg-[#161618] border border-[#2c2e33] rounded-2xl p-5 w-full flex flex-col gap-4 shadow-lg hover:shadow-2xl hover:border-[#3f424a] hover:-translate-y-1 transition-all duration-300 group"
      aria-label={`Oportunidade de arbitragem em ${homeTeam} vs ${awayTeam}`}
    >
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <div className="bg-[#b1f038] text-black px-3.5 py-1.5 rounded-full font-extrabold text-[13px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(177,240,56,0.2)]">
          <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
          LUCRO {Number(roi).toFixed(2)}%
        </div>
        <button 
          className="text-[#b1f038] hover:text-[#c4f55b] text-sm font-semibold flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#b1f038] focus:ring-offset-2 focus:ring-offset-[#161618] rounded-md px-2 py-1"
          aria-label="Adicionar à Estratégia"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Adicionar à Estratégia
        </button>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-[11px] font-bold text-[#8b8d93] uppercase tracking-wider mt-1">
        <span>{sport || 'Esporte'}</span>
        <span>{formattedDate}</span>
      </div>

      {/* League */}
      <div className="text-[#8b8d93] text-sm font-medium">
        {league || 'Liga Desconhecida'}
      </div>

      {/* Teams Section */}
      <div className="flex flex-col gap-3.5 relative mt-1">
        {/* Linha conectora visual (opcional, sutil) */}
        <div className="absolute left-4 top-8 bottom-8 w-px bg-[#2c2e33] -z-0"></div>

        {/* Home Team */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-full bg-[#3a2525] border border-[#4a2f2f] flex items-center justify-center text-[#ff6b6b] text-xs font-bold shadow-sm">
            {getInitials(homeTeam)}
          </div>
          <h3 className="text-white font-bold text-lg tracking-tight truncate pr-4" title={homeTeam}>
            {homeTeam}
          </h3>
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-full bg-[#252a3a] border border-[#2f364a] flex items-center justify-center text-[#6b8eff] text-xs font-bold shadow-sm">
            {getInitials(awayTeam)}
          </div>
          <h3 className="text-white font-bold text-lg tracking-tight truncate pr-4" title={awayTeam}>
            {awayTeam}
          </h3>
        </div>
      </div>

      {/* Odds Section */}
      <div className="flex flex-col gap-3 mt-3 border-t border-[#2c2e33]/50 pt-4">
        {legs.map((leg, index) => (
          <div key={leg.id || index} className="flex items-center justify-between gap-4 group/odd">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[#8b8d93] text-[13px] font-semibold whitespace-nowrap">
                {leg.bookmaker}
              </span>
              <span className="text-[#a1a3a8] text-[13px] truncate" title={leg.outcome}>
                {leg.outcome}
              </span>
            </div>
            <div className="bg-[#2d3827] border border-[#3d4a35] text-[#b1f038] px-3 py-1.5 rounded-lg font-bold text-sm min-w-[64px] text-center shadow-sm group-hover/odd:bg-[#36442f] transition-colors">
              {Number(leg.price).toFixed(3)}
            </div>
          </div>
        ))}
      </div>

      {/* Actions Section */}
      <div className="flex flex-col gap-3 mt-2">
        <button className="w-full border border-[#3f3f46] text-[#a1a3a8] rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#27272a] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f3f46]">
          <Info className="w-4 h-4" />
          Entenda essa operação
        </button>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => onCalculate(id)}
            className="flex-1 bg-[#b1f038] text-black rounded-xl py-3 text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(177,240,56,0.15)] hover:shadow-[0_0_25px_rgba(177,240,56,0.3)] hover:bg-[#c4f55b] transition-all focus:outline-none focus:ring-2 focus:ring-[#b1f038] focus:ring-offset-2 focus:ring-offset-[#161618]"
          >
            <Calculator className="w-4 h-4" strokeWidth={2.5} />
            CALCULAR <span className="bg-black/10 px-1.5 py-0.5 rounded ml-1">{Number(roi).toFixed(2)}%</span>
          </button>
          
          <button className="flex-1 border border-[#b1f038] text-[#b1f038] rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#b1f038]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#b1f038] focus:ring-offset-2 focus:ring-offset-[#161618]">
            <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
            Verificar Limitação
          </button>
        </div>
      </div>
    </article>
  );
}
