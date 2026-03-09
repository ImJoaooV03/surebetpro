import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Calculator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  
  const [bet, setBet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalBank, setTotalBank] = useState<number>(1000);

  useEffect(() => {
    if (id) {
      fetchOpportunity(id);
    } else {
      navigate('/');
    }
  }, [id, navigate]);

  const fetchOpportunity = async (oppId: string) => {
    try {
      const { data, error } = await supabase
        .from('surebet_opportunities')
        .select(`
          id,
          market_key,
          roi,
          events (
            home_team,
            away_team,
            league_title
          ),
          surebet_legs (
            id,
            outcome_name,
            bookmaker,
            price,
            stake_percentage
          )
        `)
        .eq('id', oppId)
        .single();

      if (error) throw error;
      setBet(data);
    } catch (error) {
      console.error('Erro ao buscar detalhes da oportunidade:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!bet || !bet.surebet_legs || bet.surebet_legs.length < 2) {
    return (
      <div className="p-8 text-center text-gray-400">
        Oportunidade inválida ou não encontrada.
      </div>
    );
  }
  
  const leg1 = bet.surebet_legs[0];
  const leg2 = bet.surebet_legs[1];

  const stake1 = (totalBank * (Number(leg1.stake_percentage) / 100));
  const stake2 = (totalBank * (Number(leg2.stake_percentage) / 100));
  
  const return1 = stake1 * Number(leg1.price);
  const return2 = stake2 * Number(leg2.price);
  
  const guaranteedProfit = ((return1 + return2) / 2) - totalBank;

  return (
    <div className="p-8 w-full max-w-5xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{bet.events?.home_team} vs {bet.events?.away_team}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>{bet.events?.league_title || 'Liga Desconhecida'}</span>
            <span>•</span>
            <span className="text-brand-400 uppercase">{bet.market_key}</span>
          </div>
        </div>
        <div className="bg-profit-500/10 border border-profit-500/20 px-6 py-3 rounded-xl text-center">
          <div className="text-xs text-profit-400 uppercase font-bold tracking-wider mb-1">ROI Garantido</div>
          <div className="text-3xl font-black text-profit-400">{Number(bet.roi).toFixed(2)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel de Configuração */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-500" />
            Configuração da Banca
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Investimento Total (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <input 
                type="number" 
                value={totalBank}
                onChange={(e) => setTotalBank(Number(e.target.value))}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div className="p-4 bg-dark-900 rounded-lg border border-dark-700">
            <div className="text-sm text-gray-400 mb-1">Lucro Líquido Estimado</div>
            <div className="text-2xl font-bold text-profit-400">R$ {guaranteedProfit.toFixed(2)}</div>
          </div>
        </div>

        {/* Distribuição de Stakes */}
        <div className="lg:col-span-2 space-y-4">
          {[leg1, leg2].map((leg, idx) => {
            const stake = idx === 0 ? stake1 : stake2;
            const ret = idx === 0 ? return1 : return2;
            
            return (
              <div key={leg.id} className="bg-dark-800 border border-dark-700 rounded-xl p-6 flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-bold">{leg.bookmaker}</div>
                  <div className="text-xl font-bold text-white">{leg.outcome_name}</div>
                </div>
                
                <div className="flex-1 text-center border-x border-dark-700 px-4">
                  <div className="text-xs text-gray-400 mb-1">Odd</div>
                  <div className="text-2xl font-black text-brand-500">{Number(leg.price).toFixed(2)}</div>
                </div>

                <div className="flex-1 text-right">
                  <div className="text-xs text-gray-400 mb-1">Aposta Recomendada</div>
                  <div className="text-xl font-bold text-white">R$ {stake.toFixed(2)}</div>
                  <div className="text-xs text-profit-400 mt-1">Retorno: R$ {ret.toFixed(2)}</div>
                </div>
              </div>
            );
          })}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 mt-4">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-200">
              <strong>Dica Profissional:</strong> Arredonde os valores das apostas para evitar limitações nas casas de apostas. Casas como a Novibet monitoram apostas com centavos quebrados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
