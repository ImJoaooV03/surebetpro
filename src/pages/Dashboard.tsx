import React, { useState, useEffect } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, Search, Calculator, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [opportunities, setOpportunities] = useState<any[]>([]);
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
            outcome_name,
            bookmaker,
            price,
            stake_percentage
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
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
    <div className="p-8 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Oportunidades em Tempo Real</h1>
          <p className="text-gray-400 text-sm">Escaneando as casas selecionadas continuamente.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar evento ou liga..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-dark-800 border border-dark-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-brand-500 transition-colors w-64"
            />
          </div>
          <button className="bg-dark-800 border border-dark-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-dark-700 transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-dark-900/50 border-b border-dark-700 text-xs uppercase tracking-wider text-gray-400">
              <th className="p-4 font-medium">Liga / Campeonato</th>
              <th className="p-4 font-medium">Evento / Data</th>
              <th className="p-4 font-medium">Mercado</th>
              <th className="p-4 font-medium">Casas & Odds</th>
              <th className="p-4 font-medium">ROI</th>
              <th className="p-4 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin mx-auto mb-2" />
                  <span className="text-gray-400 text-sm">Buscando oportunidades no banco de dados...</span>
                </td>
              </tr>
            ) : filteredBets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <AlertCircle className="w-12 h-12 mb-3 text-dark-600" />
                    <p className="text-lg font-medium text-white mb-1">Nenhuma Surebet encontrada no momento</p>
                    <p className="text-sm">O motor de arbitragem está rodando em background. Novas oportunidades aparecerão aqui automaticamente.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBets.map((bet) => {
                const isNew = differenceInMinutes(new Date(), new Date(bet.created_at)) < 5;

                return (
                  <tr key={bet.id} className="hover:bg-dark-700/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-white">
                          {bet.events?.league_title || bet.events?.sport_key || 'Desconhecido'}
                        </span>
                        {isNew && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-bold bg-brand-500 text-white rounded-full animate-pulse">
                            Novo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-white">{bet.events?.home_team} vs {bet.events?.away_team}</div>
                      <div className="text-xs text-gray-400">
                        {bet.events?.commence_time ? format(new Date(bet.events.commence_time), "dd MMM, HH:mm", { locale: ptBR }) : 'Data Indisponível'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-600 text-gray-300 uppercase">
                        {bet.market_key}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {bet.surebet_legs?.map((leg: any, idx: number) => (
                          <React.Fragment key={leg.id || idx}>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400 capitalize">{leg.bookmaker}</span>
                              <span className="text-sm font-bold text-white">{Number(leg.price).toFixed(2)}</span>
                            </div>
                            {idx === 0 && <span className="text-dark-600">vs</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-profit-500/10 text-profit-400 font-bold text-sm">
                        {Number(bet.roi).toFixed(2)}%
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => navigate(`/calculator?id=${bet.id}`)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                        title="Abrir Calculadora"
                      >
                        <Calculator className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
