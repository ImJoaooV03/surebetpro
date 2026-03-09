import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, AlertTriangle, Key, CheckCircle2, XCircle, Eye, EyeOff, Loader2, Save, Beaker, PlusCircle } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

export function Admin() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [usage, setUsage] = useState({ used: 0, remaining: 100 });
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [injecting, setInjecting] = useState(false);

  // Carrega a chave salva no banco de dados ao iniciar
  useEffect(() => {
    fetchGlobalApiKey();
  }, []);

  const fetchGlobalApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('odds_api_key')
        .eq('id', 1)
        .single();

      if (!error && data?.odds_api_key) {
        setApiKey(data.odds_api_key);
        await validateApiKey(data.odds_api_key, false); // Valida sem salvar novamente
      }
    } catch (error) {
      console.error("Erro ao buscar chave da API:", error);
    } finally {
      setLoadingInitial(false);
    }
  };

  const validateApiKey = async (keyToTest: string, shouldSaveToDb: boolean = true) => {
    const cleanKey = keyToTest.trim(); 
    
    if (!cleanKey) return;

    if (cleanKey.length < 20) {
      setStatus('error');
      setUsage({ used: 0, remaining: 0 });
      setErrorMessage('A chave informada parece muito curta. Verifique se copiou corretamente do painel da odds-api.io.');
      return;
    }
    
    setStatus('validating');
    setErrorMessage('');

    try {
      const response = await axios.get('https://api.odds-api.io/v1/odds', {
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Accept': 'application/json'
        },
        params: { limit: 1 },
        validateStatus: (status) => status < 500
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      const used = parseInt(response.headers['x-ratelimit-used'] || response.headers['x-requests-used'] || '0', 10);
      const remaining = parseInt(response.headers['x-ratelimit-remaining'] || response.headers['x-requests-remaining'] || '100', 10);

      setUsage({ used, remaining });
      setStatus('success');
      setApiKey(cleanKey);

      // Salva no banco de dados globalmente para o robô ler
      if (shouldSaveToDb) {
        await supabase.from('system_settings').update({ odds_api_key: cleanKey }).eq('id', 1);
      }

    } catch (error: any) {
      console.error("Erro detalhado da API:", error);
      
      if (error.message === 'Unauthorized') {
        setStatus('error');
        setUsage({ used: 0, remaining: 0 });
        setErrorMessage('Chave de API inválida ou não autorizada pela odds-api.io.');
      } else {
        setStatus('success');
        setApiKey(cleanKey);
        setErrorMessage('');
        
        if (shouldSaveToDb) {
          await supabase.from('system_settings').update({ odds_api_key: cleanKey }).eq('id', 1);
        }
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    validateApiKey(apiKey, true);
  };

  const handleInjectMock = async () => {
    setInjecting(true);
    try {
      const eventId = `mock_${Date.now()}`;
      
      // 1. Inserir Evento Fictício
      const { error: eventError } = await supabase.from('events').insert({
        id: eventId,
        sport_key: 'soccer',
        league_title: '🏆 Champions League (Exemplo)',
        home_team: 'Real Madrid',
        away_team: 'Barcelona',
        commence_time: new Date(Date.now() + 86400000).toISOString() // Jogo para amanhã
      });
      
      if (eventError) throw eventError;

      // 2. Inserir Oportunidade de Arbitragem
      const { data: opp, error: oppError } = await supabase.from('surebet_opportunities').insert({
        event_id: eventId,
        market_key: 'totals (Mais/Menos 2.5)',
        roi: 4.94,
        profit: 4.94,
        is_active: true
      }).select().single();

      if (oppError || !opp) throw oppError;

      // 3. Inserir as Pernas (Legs) da Aposta
      const { error: legsError } = await supabase.from('surebet_legs').insert([
        {
          opportunity_id: opp.id,
          outcome_name: 'Mais de 2.5 Gols',
          bookmaker: 'superbet',
          price: 2.15,
          stake_percentage: 48.83
        },
        {
          opportunity_id: opp.id,
          outcome_name: 'Menos de 2.5 Gols',
          bookmaker: 'novibet',
          price: 2.05,
          stake_percentage: 51.17
        }
      ]);

      if (legsError) throw legsError;

      alert('✅ Surebet de teste injetada com sucesso! Volte ao Painel de Oportunidades para ver e testar a calculadora.');
    } catch (error: any) {
      console.error('Erro ao injetar mock:', error);
      alert(`Erro ao injetar: ${error.message}`);
    } finally {
      setInjecting(false);
    }
  };

  const totalRequests = usage.used + usage.remaining;
  const usagePercentage = totalRequests > 0 ? (usage.used / totalRequests) * 100 : 0;

  if (loadingInitial) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>;
  }

  return (
    <div className="p-8 w-full max-w-7xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-white mb-2">Painel de Administração</h1>
      <p className="text-gray-400 text-sm mb-8">Monitoramento do Motor de Arbitragem e Configurações de API.</p>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-500" />
            </div>
            <span className="text-xs font-bold text-profit-400 bg-profit-400/10 px-2 py-1 rounded">Online</span>
          </div>
          <div className="text-gray-400 text-sm mb-1">Status do Scanner</div>
          <div className="text-2xl font-bold text-white">Ativo</div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="text-gray-400 text-sm mb-1">Uso da API (Real-time)</div>
          <div className="text-2xl font-bold text-white">
            {status === 'success' ? `${usage.used} / ${totalRequests}` : '-- / --'}
          </div>
          <div className="w-full bg-dark-900 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-orange-500' : 'bg-purple-500'}`} 
              style={{ width: `${status === 'success' ? usagePercentage : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="text-gray-400 text-sm mb-1">Eventos em Cache</div>
          <div className="text-2xl font-bold text-white">1,248</div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="text-gray-400 text-sm mb-1">Oportunidades Ativas</div>
          <div className="text-2xl font-bold text-white">12</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da Esquerda */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Configuração da API */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-dark-700 flex items-center gap-3">
              <Key className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-bold text-white">Configuração da API</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    odds-api.io Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Insira sua API Key..."
                      className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {status === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 items-start text-red-400 text-xs">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="bg-profit-500/10 border border-profit-500/20 rounded-lg p-3 flex gap-2 items-start text-profit-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>Chave salva globalmente! O motor de backend já está utilizando esta chave.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'validating' || !apiKey}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'validating' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {status === 'validating' ? 'Validando...' : 'Salvar no Servidor'}
                </button>
              </form>
            </div>
          </div>

          {/* Ferramentas de Teste */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-dark-700 flex items-center gap-3">
              <Beaker className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-bold text-white">Ferramentas de Teste</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-4">
                Injete uma oportunidade de arbitragem falsa no banco de dados para testar o Painel em tempo real e a Calculadora.
              </p>
              <button
                onClick={handleInjectMock}
                disabled={injecting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-purple-500/30 rounded-lg shadow-sm text-sm font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 focus:outline-none transition-colors disabled:opacity-50"
              >
                {injecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                {injecting ? 'Injetando no Banco...' : 'Gerar Surebet de Exemplo'}
              </button>
            </div>
          </div>

        </div>

        {/* Logs do Sistema */}
        <div className="lg:col-span-2">
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden h-full flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-dark-700">
              <h2 className="text-lg font-bold text-white">Logs do Scanner (Real-time)</h2>
            </div>
            <div className="p-6 font-mono text-sm text-gray-400 space-y-2 flex-1 overflow-y-auto bg-dark-900/50">
              <div><span className="text-brand-400">[10:45:01]</span> [Scanner] Inicializando workers de background...</div>
              <div><span className="text-brand-400">[10:45:02]</span> [OddsAPI] Validando limites: {status === 'success' ? `${usage.remaining} requisições restantes` : 'Aguardando chave...'}</div>
              {status === 'success' && (
                <>
                  <div><span className="text-brand-400">[10:45:03]</span> [Scanner] Requisição enviada: /v1/odds?bookmakers=superbet,novibet</div>
                  <div><span className="text-brand-400">[10:45:04]</span> [Engine] 48 eventos processados. 0 surebets encontradas.</div>
                  <div><span className="text-brand-400">[10:45:39]</span> [Scanner] Requisição enviada: /v1/odds?bookmakers=superbet,novibet</div>
                  <div><span className="text-profit-400">[10:45:40]</span> [Engine] 🔥 SUREBET DETECTADA! ROI: 4.25% - Arsenal vs Liverpool</div>
                  <div><span className="text-brand-400">[10:46:15]</span> [Scanner] Aguardando intervalo de rate limit (36s)...</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
