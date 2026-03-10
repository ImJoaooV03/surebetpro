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

    const processEvents = async (events: any[], minRoi: number) => {
      for (const event of events) {
        if (!event.commence_time) continue;
        const commenceTime = new Date(event.commence_time).getTime();
        if (commenceTime <= Date.now()) continue; // Ignora jogos ao vivo

        const opportunities = ArbitrageEngine.analyzeEvent(event);
        for (const opp of opportunities) {
          if (opp.roi >= minRoi) {
            await saveOpportunityToDb(opp);
            totalFound++;
          }
        }
      }
    };

    let leaguesToScan: string[] = [];
    
    onProgress('Mapeando ligas disponíveis...');
    try {
      const sportsRes = await axios.get(`${baseUrl}/sports`, {
        headers: { 'Authorization': `Bearer ${settings.odds_api_key}`, 'Accept': 'application/json' },
        timeout: 10000
      });
      if (Array.isArray(sportsRes.data)) {
        leaguesToScan = sportsRes.data
          .filter((s: any) => activeSportGroups.includes(s.group?.toLowerCase() || s.key?.toLowerCase()))
          .map((s: any) => s.key);
      }
    } catch (err: any) {
      console.warn('Endpoint /sports falhou, usando fallback de categorias genéricas.');
    }

    // Se a API não tiver a rota /sports, usamos os nomes genéricos (soccer, basketball) direto
    if (leaguesToScan.length === 0) {
      leaguesToScan = activeSportGroups; 
    }

    for (const leagueKey of leaguesToScan) {
      onProgress(`Analisando: ${leagueKey}...`);
      try {
        let requestUrl = `${baseUrl}${endpoint}`;
        const params: any = {
          bookmakers: activeBookmakers.join(','),
          markets: activeMarkets.join(',')
        };

        // MÁGICA: Se a URL tiver {sport}, substitui pela liga. Se não, manda como parâmetro.
        if (requestUrl.includes('{sport}')) {
          requestUrl = requestUrl.replace('{sport}', leagueKey);
        } else {
          params.sport = leagueKey;
        }

        const oddsRes = await axios.get(requestUrl, {
          headers: { 'Authorization': `Bearer ${settings.odds_api_key}`, 'Accept': 'application/json' },
          params,
          timeout: 15000
        });
        
        const events = Array.isArray(oddsRes.data) ? oddsRes.data : (oddsRes.data?.data || []);
        await processEvents(events, settings.min_roi);
        
      } catch (err: any) {
        const status = err.response?.status;
        const urlCalled = err.config?.url;
        lastErrorMsg = status === 404 ? `HTTP 404 em ${urlCalled}` : err.message;
        console.error(`Erro na liga ${leagueKey}:`, lastErrorMsg);
      }
    }

    if (totalFound === 0 && lastErrorMsg) {
      throw new Error(`Nenhuma oportunidade encontrada. Último erro da API: ${lastErrorMsg}. Verifique suas rotas no Admin.`);
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
