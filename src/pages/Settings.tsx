import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Activity, Target, Globe, Loader2, Save, CheckCircle2, Calculator, AlertTriangle, Building2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Toggle = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label?: string }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
      enabled ? 'bg-indigo-600' : 'bg-slate-300'
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
      
      setSaveMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  const activeSportsKeys = sports.filter(s => s.active).map(s => s.key);
  const estimatedLeaguesCount = activeSportsKeys.reduce((total, key) => total + (estimatedLeaguesPerSport[key] || 5), 0);
  const scansPerHour = globalSettings.scan_interval_seconds > 0 ? Math.floor(3600 / globalSettings.scan_interval_seconds) : 0;
  const estimatedRequestsPerCycle = 1 + estimatedLeaguesCount;
  const estimatedRequestsPerHour = scansPerHour * estimatedRequestsPerCycle;
  const isOverLimit = estimatedRequestsPerHour > 100;

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 w-full max-w-7xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
          <SettingsIcon className="w-6 h-6 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configurações do Scanner</h1>
      </div>
      <p className="text-slate-500 text-sm font-medium mb-10 ml-16">
        Defina as regras do motor e gerencie as casas de apostas ativas.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div className="xl:col-span-2 space-y-8">
          
          {/* Seção de Casas de Apostas */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Casas de Apostas (Bookmakers)</h2>
                <p className="text-sm text-slate-500 font-medium">Selecione quais casas o motor deve comparar (Mínimo de 2).</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmakers.length === 0 ? (
                <div className="col-span-full p-4 text-center text-slate-500 text-sm">Nenhuma casa encontrada. Execute a migração SQL.</div>
              ) : (
                bookmakers.map((bookie) => (
                  <div key={bookie.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                    <span className="text-sm font-bold text-slate-900">{bookie.title}</span>
                    <Toggle 
                      enabled={bookie.active} 
                      onChange={() => toggleBookmaker(bookie.key, bookie.active)} 
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Seção de Esportes */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Activity className="w-5 h-5 text-indigo-600" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">Categorias de Esportes</h2>
                <p className="text-sm text-slate-500 font-medium">Ative a categoria e o sistema escaneará todas as ligas mundiais disponíveis nela.</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {sports.map((sport) => (
                <div key={sport.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                  <span className="text-sm font-bold text-slate-900">{sport.title}</span>
                  <Toggle 
                    enabled={sport.active} 
                    onChange={() => toggleSport(sport.key, sport.active)} 
                  />
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
               <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start text-indigo-900 text-sm font-medium">
                  <Info className="w-5 h-5 flex-shrink-0 text-indigo-600 mt-0.5" />
                  <p><strong>Escaneamento Inteligente:</strong> Ao ativar "Futebol", o robô consultará a API para descobrir se a Premier League, Brasileirão, Champions, etc., estão com jogos abertos e fará a varredura em todas elas automaticamente.</p>
                </div>
            </div>
          </div>

          {/* Seção de Mercados */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Target className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mercados Analisados</h2>
                <p className="text-sm text-slate-500 font-medium">Quais tipos de apostas o motor deve cruzar.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {markets.map((market) => (
                <div key={market.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div>
                    <div className="text-sm font-bold text-slate-900 mb-1">{market.title}</div>
                    <div className="text-xs text-slate-500 font-medium">{market.description}</div>
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

        {/* Coluna Direita */}
        <div className="space-y-8">
          
          {/* Calculadora de Consumo de API */}
          <div className={`border shadow-sm rounded-2xl overflow-hidden ${isOverLimit ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 border-b flex items-center gap-3 ${isOverLimit ? 'border-red-100 bg-red-100/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <Calculator className={`w-5 h-5 ${isOverLimit ? 'text-red-600' : 'text-indigo-600'}`} />
              <div>
                <h2 className={`text-lg font-bold ${isOverLimit ? 'text-red-900' : 'text-slate-900'}`}>Consumo Estimado de API</h2>
                <p className={`text-sm font-medium ${isOverLimit ? 'text-red-700' : 'text-slate-500'}`}>Baseado na média de ligas mundiais.</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-end mb-5">
                <div>
                  <div className={`text-5xl font-black tracking-tight ${isOverLimit ? 'text-red-600' : 'text-slate-900'}`}>~{estimatedRequestsPerHour}</div>
                  <div className={`text-sm font-bold uppercase tracking-wider mt-1 ${isOverLimit ? 'text-red-500' : 'text-slate-400'}`}>req / hora</div>
                </div>
                <div className="text-right">
                  <div className={`text-base font-extrabold ${isOverLimit ? 'text-red-800' : 'text-slate-700'}`}>~{estimatedLeaguesCount} Ligas</div>
                  <div className={`text-sm font-medium ${isOverLimit ? 'text-red-600' : 'text-slate-500'}`}>{scansPerHour} ciclos/hora</div>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-5 overflow-hidden shadow-inner">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${isOverLimit ? 'bg-red-500' : estimatedRequestsPerHour > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min((estimatedRequestsPerHour / 100) * 100, 100)}%` }}
                ></div>
              </div>

              {isOverLimit ? (
                <div className="flex gap-3 text-sm text-red-800 bg-red-100 p-4 rounded-xl border border-red-200 font-medium">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  <p><strong>Atenção:</strong> Escanear todas as ligas ativas excederá o limite de 100 req/h. Aumente o tempo de ciclo para reduzir o consumo.</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 font-medium text-center bg-slate-50 p-3 rounded-lg border border-slate-100">Dentro do limite seguro do plano Free (100 req/h).</p>
              )}
            </div>
          </div>

          {/* Configurações Globais */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden sticky top-8">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Globe className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Escaneamento Global</h2>
                <p className="text-sm text-slate-500 font-medium">Regras gerais do motor.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tempo de Busca (Ciclo)
                </label>
                <div className="relative shadow-sm rounded-xl">
                  <input 
                    type="number" 
                    min="60"
                    step="60"
                    value={globalSettings.scan_interval_seconds}
                    onChange={(e) => setGlobalSettings({...globalSettings, scan_interval_seconds: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-24 py-3 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">segundos</span>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Ignorar Surebets com ROI menor que:
                </label>
                <div className="relative shadow-sm rounded-xl">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={globalSettings.min_roi}
                    onChange={(e) => setGlobalSettings({...globalSettings, min_roi: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">%</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSaveGlobals}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? 'Salvando...' : 'Salvar Preferências'}
                </button>

                {saveMessage && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex gap-2 items-center justify-center text-emerald-700 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
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
