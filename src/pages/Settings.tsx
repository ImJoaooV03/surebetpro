import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Activity, Target, Globe, Loader2, Save, CheckCircle2, Calculator, AlertTriangle, Building2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Toggle = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label?: string }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-dark-900 ${
      enabled ? 'bg-brand-500' : 'bg-dark-600'
    }`}
    role="switch"
    aria-checked={enabled}
    aria-label={label}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

// Estimativa média de ligas ativas por esporte no mundo para cálculo de API
const estimatedLeaguesPerSport: Record<string, number> = {
  'soccer': 40,
  'basketball': 15,
  'tennis': 20,
  'american football': 5,
  'ice hockey': 10,
  'mixed martial arts': 5,
  'volleyball': 10,
  'baseball': 5
};

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [sports, setSports] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [bookmakers, setBookmakers] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState({
    id: 1,
    scan_interval_seconds: 600,
    min_roi: 1.0,
    deep_scan: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: sportsData } = await supabase.from('sports').select('*').order('title');
      if (sportsData) setSports(sportsData);

      const { data: marketsData } = await supabase.from('markets').select('*').order('title');
      if (marketsData) setMarkets(marketsData);

      const { data: bookmakersData } = await supabase.from('bookmakers').select('*').order('title');
      if (bookmakersData) setBookmakers(bookmakersData);

      const { data: settingsData } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (settingsData) setGlobalSettings(settingsData);

    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSport = async (key: string, currentStatus: boolean) => {
    setSports(sports.map(s => s.key === key ? { ...s, active: !currentStatus } : s));
    await supabase.from('sports').update({ active: !currentStatus }).eq('key', key);
  };

  const toggleMarket = async (key: string, currentStatus: boolean) => {
    setMarkets(markets.map(m => m.key === key ? { ...m, active: !currentStatus } : m));
    await supabase.from('markets').update({ active: !currentStatus }).eq('key', key);
  };

  const toggleBookmaker = async (key: string, currentStatus: boolean) => {
    setBookmakers(bookmakers.map(b => b.key === key ? { ...b, active: !currentStatus } : b));
    await supabase.from('bookmakers').update({ active: !currentStatus }).eq('key', key);
  };

  const handleSaveGlobals = async () => {
    setSaving(true);
    try {
      await supabase.from('system_settings').update({
        scan_interval_seconds: globalSettings.scan_interval_seconds,
        min_roi: globalSettings.min_roi,
        deep_scan: globalSettings.deep_scan
      }).eq('id', 1);
      
      setSaveMessage('Configurações salvas e aplicadas ao motor!');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  // Cálculos Inteligentes da Calculadora de Consumo de API
  const activeSportsKeys = sports.filter(s => s.active).map(s => s.key);
  // Calcula a estimativa de ligas totais que serão escaneadas
  const estimatedLeaguesCount = activeSportsKeys.reduce((total, key) => total + (estimatedLeaguesPerSport[key] || 5), 0);
  
  const scansPerHour = globalSettings.scan_interval_seconds > 0 ? Math.floor(3600 / globalSettings.scan_interval_seconds) : 0;
  // 1 requisição para pegar a lista de esportes + 1 requisição por liga ativa
  const estimatedRequestsPerCycle = 1 + estimatedLeaguesCount;
  const estimatedRequestsPerHour = scansPerHour * estimatedRequestsPerCycle;
  
  const isOverLimit = estimatedRequestsPerHour > 100;

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 w-full max-w-7xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-brand-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Configurações do Scanner</h1>
      </div>
      <p className="text-gray-400 text-sm mb-8 ml-13">
        Defina as categorias principais e o robô descobrirá todas as ligas automaticamente.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div className="xl:col-span-2 space-y-8">
          
          {/* Seção de Casas de Apostas */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-dark-700 flex items-center gap-3 bg-dark-900/30">
              <Building2 className="w-5 h-5 text-orange-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Casas de Apostas (Bookmakers)</h2>
                <p className="text-xs text-gray-400">Selecione quais casas o motor deve comparar (Mínimo de 2).</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmakers.length === 0 ? (
                <div className="col-span-full p-4 text-center text-gray-500 text-sm">Nenhuma casa encontrada. Execute a migração SQL.</div>
              ) : (
                bookmakers.map((bookie) => (
                  <div key={bookie.key} className="flex items-center justify-between p-4 rounded-lg border border-dark-600 bg-dark-900/50 hover:border-dark-500 transition-colors">
                    <span className="text-sm font-bold text-white">{bookie.title}</span>
                    <Toggle 
                      enabled={bookie.active} 
                      onChange={() => toggleBookmaker(bookie.key, bookie.active)} 
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Seção de Esportes (Agora Genéricos) */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-dark-700 flex items-center gap-3 bg-dark-900/30">
              <Activity className="w-5 h-5 text-brand-400" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Categorias de Esportes</h2>
                <p className="text-xs text-gray-400">Ative a categoria e o sistema escaneará <strong>todas as ligas mundiais</strong> disponíveis nela.</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {sports.map((sport) => (
                <div key={sport.key} className="flex items-center justify-between p-4 rounded-lg border border-dark-600 bg-dark-900/50 hover:border-dark-500 transition-colors">
                  <span className="text-sm font-medium text-white">{sport.title}</span>
                  <Toggle 
                    enabled={sport.active} 
                    onChange={() => toggleSport(sport.key, sport.active)} 
                  />
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
               <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3 items-start text-blue-300 text-xs">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p><strong>Escaneamento Inteligente:</strong> Ao ativar "Futebol", o robô consultará a API para descobrir se a Premier League, Brasileirão, Champions, etc., estão com jogos abertos e fará a varredura em todas elas automaticamente.</p>
                </div>
            </div>
          </div>

          {/* Seção de Mercados */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-dark-700 flex items-center gap-3 bg-dark-900/30">
              <Target className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Mercados Analisados</h2>
                <p className="text-xs text-gray-400">Quais tipos de apostas o motor deve cruzar.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {markets.map((market) => (
                <div key={market.key} className="flex items-center justify-between p-4 rounded-lg border border-dark-600 bg-dark-900/50 hover:border-dark-500 transition-colors">
                  <div>
                    <div className="text-sm font-bold text-white mb-1">{market.title}</div>
                    <div className="text-xs text-gray-400">{market.description}</div>
                  </div>
                  <Toggle 
                    enabled={market.active} 
                    onChange={() => toggleMarket(market.key, market.active)} 
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Coluna Direita: Escaneamento Global e Calculadora */}
        <div className="space-y-8">
          
          {/* Calculadora de Consumo de API */}
          <div className={`border rounded-xl overflow-hidden ${isOverLimit ? 'bg-red-500/10 border-red-500/30' : 'bg-dark-800 border-dark-700'}`}>
            <div className={`p-6 border-b flex items-center gap-3 ${isOverLimit ? 'border-red-500/20 bg-red-500/5' : 'border-dark-700 bg-dark-900/30'}`}>
              <Calculator className={`w-5 h-5 ${isOverLimit ? 'text-red-400' : 'text-blue-400'}`} />
              <div>
                <h2 className={`text-lg font-bold ${isOverLimit ? 'text-red-400' : 'text-white'}`}>Consumo Estimado de API</h2>
                <p className={`text-xs ${isOverLimit ? 'text-red-300' : 'text-gray-400'}`}>Baseado na média de ligas mundiais.</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-4xl font-black text-white">~{estimatedRequestsPerHour}</div>
                  <div className="text-sm text-gray-400">req / hora</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-300">~{estimatedLeaguesCount} Ligas</div>
                  <div className="text-xs text-gray-500">{scansPerHour} ciclos/hora</div>
                </div>
              </div>

              <div className="w-full bg-dark-900 rounded-full h-2 mb-4 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${isOverLimit ? 'bg-red-500' : estimatedRequestsPerHour > 80 ? 'bg-orange-500' : 'bg-profit-500'}`} 
                  style={{ width: `${Math.min((estimatedRequestsPerHour / 100) * 100, 100)}%` }}
                ></div>
              </div>

              {isOverLimit ? (
                <div className="flex gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p><strong>Atenção:</strong> Escanear todas as ligas mundiais desses esportes excederá o limite de 100 req/h. Aumente o tempo de ciclo para reduzir o consumo.</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center">Dentro do limite seguro do plano Free (100 req/h).</p>
              )}
            </div>
          </div>

          {/* Configurações Globais */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden sticky top-8">
            <div className="p-6 border-b border-dark-700 flex items-center gap-3 bg-dark-900/30">
              <Globe className="w-5 h-5 text-profit-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Escaneamento Global</h2>
                <p className="text-xs text-gray-400">Regras gerais do motor.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Tempo de Busca (Ciclo) */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Tempo de Busca (Ciclo)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="60"
                    step="60"
                    value={globalSettings.scan_interval_seconds}
                    onChange={(e) => setGlobalSettings({...globalSettings, scan_interval_seconds: Number(e.target.value)})}
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-4 pr-20 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">segundos</span>
                </div>
              </div>

              <div className="w-full h-px bg-dark-700"></div>

              {/* ROI Mínimo */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Ignorar Surebets com ROI menor que:
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={globalSettings.min_roi}
                    onChange={(e) => setGlobalSettings({...globalSettings, min_roi: Number(e.target.value)})}
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSaveGlobals}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-dark-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Salvando...' : 'Salvar Preferências'}
                </button>

                {saveMessage && (
                  <div className="mt-4 bg-profit-500/10 border border-profit-500/20 rounded-lg p-3 flex gap-2 items-center justify-center text-profit-400 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {saveMessage}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
