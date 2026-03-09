import React, { useState, useEffect } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, Search, Calculator, Loader2, AlertCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Interface estrita para os dados da oportunidade
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
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Oportunidades em Tempo Real</h1>
          <p className="text-gray-400 text-sm">Escaneando as casas selecionadas continuamente.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar evento ou liga..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <button className="bg-dark-800 border border-dark-700 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-dark-700 transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
          <span className="text-gray-400 text-sm">Buscando oportunidades no banco de dados...</span>
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <AlertCircle className="w-12 h-12 mb-3 text-dark-600" />
            <p className="text-lg font-medium text-white mb-1">Nenhuma Surebet encontrada no momento</p>
            <p className="text-sm max-w-md text-center">O motor de arbitragem está rodando em background. Novas oportunidades aparecerão aqui automaticamente.</p>
          </div>
        </div>
      ) : (
        /* Grid Layout: 1 col on mobile, 2 cols on lg screens */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBets.map((bet) => {
            const isNew = differenceInMinutes(new Date(), new Date(bet.created_at)) < 5;
            const leg1 = bet.surebet_legs[0];
            const leg2 = bet.surebet_legs[1];

            // Formatação de data limpa (ex: "10 mar, 18:46")
            const formattedDate = bet.events?.commence_time 
              ? format(new Date(bet.events.commence_time), "dd MMM, HH:mm", { locale: ptBR }).replace('.', '')
              : 'Data Indisponível';

            return (
              <div 
                key={bet.id} 
                className="bg-dark-800 border border-dark-700 rounded-2xl p-5 flex flex-col hover:border-dark-600 hover:shadow-2xl hover:shadow-black/50 transition-all duration-300 group"
              >
                {/* Card Header: League & ROI */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Trophy className="w-[18px] h-[18px] text-yellow-500 flex-shrink-0" />
                    <span className="text-[15px] font-medium truncate" title={bet.events?.league_title || bet.events?.sport_key}>
                      {bet.events?.league_title || bet.events?.sport_key || 'Desconhecido'}
                    </span>
                    {isNew && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-brand-600 text-white rounded-full animate-pulse flex-shrink-0">
                        NOVO
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <span className="text-xl font-bold text-profit-400">
                      {Number(bet.roi).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Card Body: Event Info */}
                <div className="mb-6">
                  <h3 className="text-[22px] font-bold text-white leading-tight mb-2 tracking-tight line-clamp-2" title={`${bet.events?.home_team} vs ${bet.events?.away_team}`}>
                    {bet.events?.home_team} vs {bet.events?.away_team}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{formattedDate}</span>
                    <span className="w-1 h-1 rounded-full bg-dark-600"></span>
                    <span className="px-2.5 py-1 rounded-md bg-dark-700/50 text-gray-300 text-xs font-medium uppercase tracking-wider truncate max-w-[200px]" title={bet.market_key}>
                      {bet.market_key}
                    </span>
                  </div>
                </div>

                {/* Card Odds Comparison (Darker Inner Box) */}
                <div className="bg-dark-900 rounded-xl p-4 flex items-center justify-between mb-5 border border-dark-700/50 mt-auto">
                  {/* Leg 1 */}
                  <div className="flex flex-col w-[42%]">
                    <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-0.5 truncate">{leg1?.bookmaker}</span>
                    <span className="text-[15px] text-gray-300 truncate" title={leg1?.outcome_name}>{leg1?.outcome_name}</span>
                    <span className="text-[28px] font-bold text-white mt-1 leading-none">{Number(leg1?.price).toFixed(2)}</span>
                  </div>
                  
                  {/* VS Badge */}
                  <div className="text-sm font-bold text-gray-500 lowercase px-2">
                    vs
                  </div>

                  {/* Leg 2 */}
                  <div className="flex flex-col w-[42%] text-right">
                    <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-0.5 truncate">{leg2?.bookmaker}</span>
                    <span className="text-[15px] text-gray-300 truncate" title={leg2?.outcome_name}>{leg2?.outcome_name}</span>
                    <span className="text-[28px] font-bold text-white mt-1 leading-none">{Number(leg2?.price).toFixed(2)}</span>
                  </div>
                </div>

                {/* Card Action Button */}
                <button 
                  onClick={() => navigate(`/calculator?id=${bet.id}`)}
                  className="w-full bg-transparent border border-dark-600 hover:bg-dark-700 hover:border-dark-500 text-gray-300 hover:text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
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
