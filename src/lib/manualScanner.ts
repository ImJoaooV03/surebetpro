import axios from 'axios';
import { supabase } from './supabase';
import { ArbitrageEngine, SurebetOpportunity } from './arbitrage';

export async function runManualScan(onProgress: (msg: string) => void): Promise<number> {
  try {
    onProgress('Buscando configurações...');
    const { data: settings, error: settingsError } = await supabase.from('system_settings').select('*').single();
    
    if (settingsError || !settings?.odds_api_key) {
      throw new Error('API Key não configurada. Vá em Admin e adicione sua chave.');
    }

    const baseUrl = settings.api_base_url ? settings.api_base_url.replace(/\/$/, '') : 'https://api.odds-api.io/v1';
    const endpoint = settings.api_endpoint_odds ? (settings.api_endpoint_odds.startsWith('/') ? settings.api_endpoint_odds : `/${settings.api_endpoint_odds}`) : '/odds';
    const fullUrl = `${baseUrl}${endpoint}`;

    const { data: sports } = await supabase.from('sports').select('key').eq('active', true);
    const { data: markets } = await supabase.from('markets').select('key').eq('active', true);
    const { data: bookmakers } = await supabase.from('bookmakers').select('key').eq('active', true);

    const activeSportGroups = sports?.map(s => s.key.toLowerCase()) || [];
    const activeMarkets = markets?.map(m => m.key) || ['h2h'];
    const activeBookmakers = bookmakers?.map(b => b.key) || ['superbet', 'novibet'];

    if (activeBookmakers.length < 2) throw new Error('Ative pelo menos 2 casas de apostas nas Configurações.');
    if (activeSportGroups.length === 0) throw new Error('Ative pelo menos 1 esporte nas Configurações.');

    let totalFound = 0;
    let lastErrorMsg = '';

    const processEvents = async (events: any[]) => {
      for (const event of events) {
        if (!event.commence_time) continue;
        const commenceTime = new Date(event.commence_time).getTime();
        if (commenceTime <= Date.now()) continue; // Ignora jogos ao vivo

        const opportunities = ArbitrageEngine.analyzeEvent(event);
        for (const opp of opportunities) {
          if (opp.roi >= settings.min_roi) {
            await saveOpportunityToDb(opp);
            totalFound++;
          }
        }
      }
    };

    onProgress('Realizando varredura global nas casas de apostas...');
    try {
      const oddsRes = await axios.get(fullUrl, {
        headers: { 'Authorization': `Bearer ${settings.odds_api_key}`, 'Accept': 'application/json' },
        params: {
          bookmakers: activeBookmakers.join(','),
          markets: activeMarkets.join(',')
        },
        timeout: 20000
      });
      
      if (Array.isArray(oddsRes.data)) {
        await processEvents(oddsRes.data);
      } else {
        throw new Error(`A API retornou um formato inesperado. Verifique o endpoint.`);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      const urlCalled = err.config?.url;
      
      if (status === 404) {
        throw new Error(`HTTP 404: A rota ${urlCalled} não existe. Vá em Admin e corrija a URL Base ou o Endpoint.`);
      }
      
      lastErrorMsg = status ? `HTTP ${status} em ${urlCalled}: ${JSON.stringify(data)}` : err.message;
      throw new Error(`A API rejeitou a requisição. Detalhes: ${lastErrorMsg}`);
    }

    onProgress(`Scan Finalizado!`);
    return totalFound;

  } catch (error: any) {
    console.error('Erro no Scanner Manual:', error);
    throw new Error(error.message || 'Erro desconhecido ao escanear a API.');
  }
}

async function saveOpportunityToDb(opp: SurebetOpportunity) {
  try {
    await supabase.from('events').upsert({
      id: opp.eventId,
      sport_key: opp.sportKey,
      league_title: opp.leagueTitle,
      home_team: opp.homeTeam,
      away_team: opp.awayTeam,
      commence_time: opp.commenceTime
    }, { onConflict: 'id' });

    const { data: savedOpp, error: oppError } = await supabase.from('surebet_opportunities').insert({
      event_id: opp.eventId,
      market_key: opp.marketKey,
      roi: opp.roi,
      profit: opp.profit,
      is_active: true
    }).select().single();

    if (oppError || !savedOpp) return;

    const legsToInsert = opp.legs.map(leg => ({
      opportunity_id: savedOpp.id,
      outcome_name: leg.outcomeName,
      bookmaker: leg.bookmaker,
      price: leg.price,
      stake_percentage: leg.stakePercentage
    }));

    await supabase.from('surebet_legs').insert(legsToInsert);
  } catch (err) {
    console.error('Erro ao salvar no BD:', err);
  }
}
