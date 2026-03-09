import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newAlert, setNewAlert] = useState({ min_roi: 3.0, sport_key: 'soccer' });

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase.from('user_alerts').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.from('user_alerts').insert({
        user_id: user?.id,
        min_roi: newAlert.min_roi,
        sport_key: newAlert.sport_key
      });
      fetchAlerts();
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('user_alerts').delete().eq('id', id);
    fetchAlerts();
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-10 h-10 text-[#39FF14] animate-spin" /></div>;

  return (
    <div className="p-6 md:p-10 w-full max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-xl bg-[#39FF14]/10 flex items-center justify-center border border-[#39FF14]/20 shadow-sm">
          <Bell className="w-6 h-6 text-[#39FF14]" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Sistema de Alertas</h1>
      </div>
      <p className="text-[#8b8d93] text-sm font-medium mb-10 ml-16">
        Configure regras para ser notificado quando uma oportunidade de ouro aparecer.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-[#161618] border border-[#2c2e33] rounded-2xl p-6 shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-6">Novo Alerta</h2>
          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">ROI Mínimo (%)</label>
              <input 
                type="number" step="0.1" required
                value={newAlert.min_roi} onChange={e => setNewAlert({...newAlert, min_roi: Number(e.target.value)})}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#39FF14] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Esporte</label>
              <select 
                value={newAlert.sport_key} onChange={e => setNewAlert({...newAlert, sport_key: e.target.value})}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#39FF14] outline-none"
              >
                <option value="soccer">Futebol</option>
                <option value="basketball">Basquete</option>
                <option value="tennis">Tênis</option>
                <option value="any">Qualquer Esporte</option>
              </select>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-[#39FF14] text-black font-bold py-3 rounded-xl mt-4 hover:bg-[#6BFF4D] transition-colors flex justify-center items-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Criar Alerta
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">Meus Alertas Ativos</h2>
          {alerts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#333] rounded-2xl text-gray-500">Nenhum alerta configurado.</div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="bg-[#161618] border border-[#2c2e33] rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#39FF14]/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#39FF14]" />
                  </div>
                  <div>
                    <div className="text-white font-bold">Avisar se ROI &gt; {alert.min_roi}%</div>
                    <div className="text-sm text-gray-500 uppercase">{alert.sport_key === 'any' ? 'Qualquer Esporte' : alert.sport_key}</div>
                  </div>
                </div>
                <button onClick={() => handleDelete(alert.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
          <div className="mt-6 p-4 bg-[#111] border border-[#333] rounded-xl text-sm text-gray-400">
            * Integração com Telegram e WhatsApp estará disponível no plano Pro em breve. Por enquanto, os alertas aparecerão como notificações no navegador.
          </div>
        </div>
      </div>
    </div>
  );
}
