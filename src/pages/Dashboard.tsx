import React, { useState, useEffect } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, Search, Calculator, Loader2, AlertCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SurebetLeg {
  id: string;
  outcome_name: string;
  bookmaker: string;
  price: number;
  stake_percentage: number;
}

interface EventData {
  home_team: string;
  away_team: string;
  commence_time: string;
  league_title: string;
  sport_key: string;
}

interface Opportunity {
  id: string;
  market_key: string;
  roi: number;
  profit: number;
  created_at: string;
  events: EventData;
  surebet_legs: SurebetLeg[];
}

export function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOpportunities();

    const channel = supabase
      .channel('public:surebet_opportunities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surebet_opportunities' }, () => {
        fetchOpportunities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('surebet_opportunities')
        .select(`
          id,
          market_key,
          roi,
          profit,
          created_at,
          events (
            home_team,
            away_team,
            commence_time,
            league_title,
            sport_key
          ),
          surebet_legs (
            id,
            outcome_name,
            bookmaker,
            price,
            stake_percentage
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities((data as unknown as Opportunity[]) || []);
    } catch (error) {
      console.error('Erro ao buscar oportunidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBets = opportunities.filter(bet => {
    const eventName = `${bet.events?.home_team} vs ${bet.events?.away_team}`.toLowerCase();
    const leagueName = bet.events?.league_title?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return eventName.includes(search) || leagueName.includes(search);
  });

  return (
    <div className="p-6 md:p-10 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Painel de Oportunidades</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoramento em tempo real das melhores surebets do mercado.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-80 shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar times ou campeonatos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <span className="text-slate-500 text-sm font-medium">Analisando mercados e calculando margens...</span>
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-16 text-center">
          <div className="flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-900 mb-2">Nenhuma Surebet encontrada no momento</p>
            <p className="text-sm max-w-md text-center leading-relaxed">O motor de arbitragem está varrendo as casas de apostas. Novas oportunidades 100% seguras aparecerão aqui automaticamente.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBets.map((bet) => {
            const isNew = differenceInMinutes(new Date(), new Date(bet.created_at)) < 5;
            const leg1 = bet.surebet_legs[0];
            const leg2 = bet.surebet_legs[1];

            const formattedDate = bet.events?.commence_time 
              ? format(new Date(bet.events.commence_time), "dd MMM, HH:mm", { locale: ptBR }).replace('.', '')
              : 'Data Indisponível';

            return (
              <div 
                key={bet.id} 
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Card Header: League & ROI */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100/50">
                      <Trophy className="w-4 h-4 flex-shrink-0" />
                    </div>
                    <span className="text-[14px] font-semibold truncate" title={bet.events?.league_title || bet.events?.sport_key}>
                      {bet.events?.league_title || bet.events?.sport_key || 'Desconhecido'}
                    </span>
                    {isNew && (
                      <span className="ml-2 px-2.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full animate-pulse flex-shrink-0 border border-indigo-200">
                        NOVO
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-4 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                    <span className="text-lg font-black text-emerald-600">
                      {Number(bet.roi).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Card Body: Event Info */}
                <div className="mb-6">
                  <h3 className="text-[20px] font-extrabold text-slate-900 leading-tight mb-2.5 tracking-tight line-clamp-2" title={`${bet.events?.home_team} vs ${bet.events?.away_team}`}>
                    {bet.events?.home_team} <span className="text-slate-400 font-medium text-lg mx-1">vs</span> {bet.events?.away_team}
                  </h3>
                  <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium">
                    <span>{formattedDate}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider truncate max-w-[200px]" title={bet.market_key}>
                      {bet.market_key}
                    </span>
                  </div>
                </div>

                {/* Card Odds Comparison (Light Inner Box) */}
                <div className="bg-slate-50 rounded-xl p-5 flex items-center justify-between mb-6 border border-slate-200 mt-auto shadow-inner shadow-slate-100/50">
                  {/* Leg 1 */}
                  <div className="flex flex-col w-[42%]">
                    <span className="text-[11px] text-slate-500 uppercase font-extrabold tracking-wider mb-1 truncate">{leg1?.bookmaker}</span>
                    <span className="text-[14px] text-slate-700 font-semibold truncate" title={leg1?.outcome_name}>{leg1?.outcome_name}</span>
                    <span className="text-[26px] font-black text-slate-900 mt-1 leading-none">{Number(leg1?.price).toFixed(2)}</span>
                  </div>
                  
                  {/* VS Badge */}
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm z-10">
                    <span className="text-xs font-bold text-slate-400">vs</span>
                  </div>

                  {/* Leg 2 */}
                  <div className="flex flex-col w-[42%] text-right">
                    <span className="text-[11px] text-slate-500 uppercase font-extrabold tracking-wider mb-1 truncate">{leg2?.bookmaker}</span>
                    <span className="text-[14px] text-slate-700 font-semibold truncate" title={leg2?.outcome_name}>{leg2?.outcome_name}</span>
                    <span className="text-[26px] font-black text-slate-900 mt-1 leading-none">{Number(leg2?.price).toFixed(2)}</span>
                  </div>
                </div>

                {/* Card Action Button */}
                <button 
                  onClick={() => navigate(`/calculator?id=${bet.id}`)}
                  className="w-full bg-white border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-600 text-indigo-600 hover:text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Calculator className="w-4 h-4" />
                  Calcular Arbitragem
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
