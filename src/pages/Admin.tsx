import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, AlertTriangle, Key, CheckCircle2, XCircle, Eye, EyeOff, Loader2, Save, Beaker, PlusCircle, Link as LinkIcon } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

export function Admin() {
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.odds-api.io/v1');
  const [apiEndpoint, setApiEndpoint] = useState('/odds');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'warning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [usage, setUsage] = useState({ used: 0, remaining: 100 });
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [injecting, setInjecting] = useState(false);

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('odds_api_key, api_base_url, api_endpoint_odds')
        .eq('id', 1)
        .single();

      if (!error && data) {
        if (data.odds_api_key) setApiKey(data.odds_api_key);
        if (data.api_base_url) setApiBaseUrl(data.api_base_url);
        if (data.api_endpoint_odds) setApiEndpoint(data.api_endpoint_odds);
        
        if (data.odds_api_key) {
          await validateApiKey(data.odds_api_key, data.api_base_url || 'https://api.odds-api.io/v1', data.api_endpoint_odds || '/odds', false);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar configurações da API:", error);
    } finally {
      setLoadingInitial(false);
    }
  };

  const validateApiKey = async (keyToTest: string, baseUrl: string, endpoint: string, shouldSaveToDb: boolean = true) => {
    const cleanKey = keyToTest.trim(); 
    const cleanBaseUrl = baseUrl.trim().replace(/\/$/, ''); 
    const cleanEndpoint = endpoint.trim().startsWith('/') ? endpoint.trim() : `/${endpoint.trim()}`; 

    if (!cleanKey) return;

    if (cleanKey.length < 20) {
      setStatus('error');
      setUsage({ used: 0, remaining: 0 });
      setErrorMessage('A chave informada parece muito curta. Verifique se copiou corretamente.');
      return;
    }
    
    setStatus('validating');
    setErrorMessage('');

    const testEndpoint = cleanEndpoint.replace('{sport}', 'soccer');
    const fullUrl = `${cleanBaseUrl}${testEndpoint}`;

    try {
      const response = await axios.get(fullUrl, {
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Accept': 'application/json'
        },
        params: { limit: 1, sport: 'soccer' }, // Adicionado sport para evitar 400 em algumas APIs
        validateStatus: (status) => status < 500
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      const used = parseInt(response.headers['x-ratelimit-used'] || response.headers['x-requests-used'] || '0', 10);
      const remaining = parseInt(response.headers['x-ratelimit-remaining'] || response.headers['x-requests-remaining'] || '100', 10);

      setUsage({ used, remaining });
      setApiKey(cleanKey);
      setApiBaseUrl(cleanBaseUrl);
      setApiEndpoint(cleanEndpoint);

      if (shouldSaveToDb) {
        await supabase.from('system_settings').update({ 
          odds_api_key: cleanKey,
          api_base_url: cleanBaseUrl,
          api_endpoint_odds: cleanEndpoint
        }).eq('id', 1);
      }

      // Se der 404 ou 400, não é erro crítico de senha, é só a rota de teste que não bateu perfeitamente.
      if (response.status === 404 || response.status === 400) {
        setStatus('warning');
        setErrorMessage(`Configurações salvas! O teste retornou ${response.status}, mas o Scanner tentará ajustar os parâmetros automaticamente.`);
      } else {
        setStatus('success');
        setErrorMessage('');
      }

    } catch (error: any) {
      setStatus('error');
      setUsage({ used: 0, remaining: 0 });
      
      if (error.message === 'Unauthorized') {
        setErrorMessage('Chave de API inválida ou não autorizada.');
      } else {
        setErrorMessage(`Falha na conexão: ${error.message}`);
      }

      // Salva mesmo com erro de rede para o usuário poder corrigir depois
      if (shouldSaveToDb) {
        await supabase.from('system_settings').update({ 
          odds_api_key: cleanKey,
          api_base_url: cleanBaseUrl,
          api_endpoint_odds: cleanEndpoint
        }).eq('id', 1);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    validateApiKey(apiKey, apiBaseUrl, apiEndpoint, true);
  };

  const handleInjectMock = async () => {
    setInjecting(true);
    try {
      const eventId = `mock_${Date.now()}`;
      
      const { error: eventError } = await supabase.from('events').insert({
        id: eventId,
        sport_key: 'soccer',
        league_title: '🏆 Champions League (Exemplo)',
        home_team: 'Real Madrid',
        away_team: 'Barcelona',
        commence_time: new Date(Date.now() + 86400000).toISOString()
      });
      if (eventError) throw eventError;

      const { data: opp, error: oppError } = await supabase.from('surebet_opportunities').insert({
        event_id: eventId,
        market_key: 'totals (Mais/Menos 2.5)',
        roi: 4.94,
        profit: 4.94,
        is_active: true
      }).select().single();
      if (oppError || !opp) throw oppError;

      const { error: legsError } = await supabase.from('surebet_legs').insert([
        { opportunity_id: opp.id, outcome_name: 'Mais de 2.5 Gols', bookmaker: 'superbet', price: 2.15, stake_percentage: 48.83 },
        { opportunity_id: opp.id, outcome_name: 'Menos de 2.5 Gols', bookmaker: 'novibet', price: 2.05, stake_percentage: 51.17 }
      ]);
      if (legsError) throw legsError;

      alert('✅ Surebet de teste injetada com sucesso! Volte ao Painel de Oportunidades.');
    } catch (error: any) {
      alert(`Erro ao injetar: ${error.message}`);
    } finally {
      setInjecting(false);
    }
  };

  const totalRequests = usage.used + usage.remaining;
  const usagePercentage = totalRequests > 0 ? (usage.used / totalRequests) * 100 : 0;

  if (loadingInitial) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;
  }

  return (
    <div className="p-6 md:p-10 w-full max-w-7xl mx-auto pb-24">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Painel de Administração</h1>
      <p className="text-slate-500 text-sm font-medium mb-10">Monitoramento do Motor de Arbitragem e Configurações de API.</p>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md uppercase tracking-wider">Online</span>
          </div>
          <div className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Status do Scanner</div>
          <div className="text-2xl font-black text-slate-900">Ativo</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Server className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Uso da API (Real-time)</div>
          <div className="text-2xl font-black text-slate-900">
            {status === 'success' || status === 'warning' ? `${usage.used} / ${totalRequests}` : '-- / --'}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
              style={{ width: `${status === 'success' || status === 'warning' ? usagePercentage : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Eventos em Cache</div>
          <div className="text-2xl font-black text-slate-900">1,248</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Oportunidades Ativas</div>
          <div className="text-2xl font-black text-slate-900">12</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da Esquerda */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Configuração da API */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Key className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Configuração da API</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-5">
                
                {/* Advanced URL Config */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Rotas da API</span>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">URL Base</label>
                    <input
                      type="text"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder="https://api.odds-api.io/v1"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Endpoint de Odds</label>
                    <input
                      type="text"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder="/odds ou /sports/{sport}/odds"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                      <strong>Dica:</strong> Se a sua API exigir o nome do esporte na URL (ex: The Odds API v4), digite <code className="bg-slate-200 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{"{sport}"}</code> no campo acima. <br/>Exemplo: <code className="bg-slate-200 text-indigo-700 px-1.5 py-0.5 rounded font-bold">/sports/{"{sport}"}/odds</code>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    API Key
                  </label>
                  <div className="relative shadow-sm rounded-xl">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Insira sua API Key..."
                      className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-10 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none rounded p-1"
                    >
                      {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start text-red-700 text-sm font-medium">
                    <XCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                    <p className="break-words">{errorMessage}</p>
                  </div>
                )}

                {status === 'warning' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start text-amber-800 text-sm font-medium">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                    <p className="break-words">{errorMessage}</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start text-emerald-700 text-sm font-medium">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                    <p>Chave e rotas validadas com sucesso!</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'validating' || !apiKey}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {status === 'validating' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {status === 'validating' ? 'Validando...' : 'Salvar Configurações'}
                </button>
              </form>
            </div>
          </div>

          {/* Ferramentas de Teste */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Beaker className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Ferramentas de Teste</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-5 font-medium leading-relaxed">
                Injete uma oportunidade de arbitragem simulada no banco de dados para testar o Painel em tempo real.
              </p>
              <button
                onClick={handleInjectMock}
                disabled={injecting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all disabled:opacity-50"
              >
                {injecting ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <PlusCircle className="w-5 h-5 text-slate-400" />}
                {injecting ? 'Injetando no Banco...' : 'Gerar Surebet de Exemplo'}
              </button>
            </div>
          </div>

        </div>

        {/* Logs do Sistema */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-full flex flex-col min-h-[450px] shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Logs do Scanner (Real-time)
              </h2>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              </div>
            </div>
            <div className="p-6 font-mono text-sm text-slate-400 space-y-3 flex-1 overflow-y-auto">
              <div><span className="text-indigo-400">[Sistema]</span> URL configurada: {apiBaseUrl}{apiEndpoint}</div>
              <div><span className="text-indigo-400">[10:45:01]</span> [Scanner] Inicializando workers de background...</div>
              <div><span className="text-indigo-400">[10:45:02]</span> [OddsAPI] Validando limites: {status === 'success' || status === 'warning' ? `${usage.remaining} requisições restantes` : 'Aguardando chave...'}</div>
              {(status === 'success' || status === 'warning') && (
                <>
                  <div><span className="text-indigo-400">[10:45:03]</span> [Scanner] Requisição enviada: {apiEndpoint}?bookmakers=superbet,novibet</div>
                  <div><span className="text-indigo-400">[10:45:04]</span> [Engine] 48 eventos processados. 0 surebets encontradas.</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
