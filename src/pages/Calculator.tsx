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
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!bet || !bet.surebet_legs || bet.surebet_legs.length < 2) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
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
    <div className="p-6 md:p-10 w-full max-w-5xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 py-1 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            {bet.events?.home_team} <span className="text-slate-400 font-medium mx-1">vs</span> {bet.events?.away_team}
          </h1>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-700">{bet.events?.league_title || 'Liga Desconhecida'}</span>
            <span>•</span>
            <span className="text-indigo-600 uppercase tracking-wider font-bold">{bet.market_key}</span>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-8 py-4 rounded-2xl text-center shadow-sm w-full md:w-auto">
          <div className="text-xs text-emerald-700 uppercase font-extrabold tracking-widest mb-1">ROI Garantido</div>
          <div className="text-4xl font-black text-emerald-600">{Number(bet.roi).toFixed(2)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel de Configuração */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            Configuração da Banca
          </h2>
          
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2">Investimento Total (R$)</label>
            <div className="relative shadow-sm rounded-xl">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
              <input 
                type="number" 
                value={totalBank}
                onChange={(e) => setTotalBank(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 font-black text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-sm font-bold text-slate-500 mb-1">Lucro Líquido Estimado</div>
            <div className="text-3xl font-black text-emerald-600">R$ {guaranteedProfit.toFixed(2)}</div>
          </div>
        </div>

        {/* Distribuição de Stakes */}
        <div className="lg:col-span-2 space-y-5">
          {[leg1, leg2].map((leg, idx) => {
            const stake = idx === 0 ? stake1 : stake2;
            const ret = idx === 0 ? return1 : return2;
            
            return (
              <div key={leg.id} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-sm gap-6 md:gap-0">
                <div className="flex-1 text-center md:text-left">
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-1.5 font-extrabold">{leg.bookmaker}</div>
                  <div className="text-xl font-bold text-slate-900">{leg.outcome_name}</div>
                </div>
                
                <div className="flex-1 text-center md:border-x border-slate-200 px-4">
                  <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">Odd Fixada</div>
                  <div className="text-3xl font-black text-indigo-600">{Number(leg.price).toFixed(2)}</div>
                </div>

                <div className="flex-1 text-center md:text-right">
                  <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">Apostar Exatamente</div>
                  <div className="text-2xl font-black text-slate-900">R$ {stake.toFixed(2)}</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1">Retorno: R$ {ret.toFixed(2)}</div>
                </div>
              </div>
            );
          })}

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-4 mt-6 items-start">
            <AlertCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-900 leading-relaxed">
              <strong>Dica Profissional:</strong> Arredonde os valores das apostas para evitar limitações nas casas de apostas. Casas como a Novibet monitoram apostas com centavos quebrados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
