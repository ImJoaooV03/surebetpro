import axios from 'axios';
import { supabase } from './supabase';
import { ArbitrageEngine, SurebetOpportunity } from './arbitrage';

export async function runManualScan(onProgress: (msg: string) => void): Promise<number> {
  try {
    onProgress('Buscando configurações...');
    const { data: settings } = await supabase.from('system_settings').select('*').single();
    
    if (!settings?.odds_api_key) {
      throw new Error('API Key não configurada. Vá em Admin e adicione sua chave.');
    }

    const { data: sports } = await supabase.from('sports').select('key').eq('active', true);
    const { data: markets } = await supabase.from('markets').select('key').eq('active', true);
    const { data: bookmakers } = await supabase.from('bookmakers').select('key').eq('active', true);

    const activeSportGroups = sports?.map(s => s.key.toLowerCase()) || [];
    const activeMarkets = markets?.map(m => m.key) || ['h2h'];
    const activeBookmakers = bookmakers?.map(b => b.key) || ['superbet', 'novibet'];

    if (activeBookmakers.length < 2) throw new Error('Ative pelo menos 2 casas de apostas nas Configurações.');
    if (activeSportGroups.length === 0) throw new Error('Ative pelo menos 1 esporte nas Configurações.');

    onProgress('Consultando ligas ativas no mundo...');
    const sportsRes = await axios.get('https://api.odds-api.io/v1/sports', {
      headers: { 'Authorization': `Bearer ${settings.odds_api_key}`, 'Accept': 'application/json' }
    });

    const leaguesToScan = sportsRes.data.filter((apiSport: any) => 
      activeSportGroups.includes(apiSport.group.toLowerCase())
    );

    let totalFound = 0;

    for (const league of leaguesToScan) {
      onProgress(`Analisando: ${league.title}...`);
      
      try {
        const oddsRes = await axios.get('https://api.odds-api.io/v1/odds', {
          headers: { 'Authorization': `Bearer ${settings.odds_api_key}`, 'Accept': 'application/json' },
          params: {
            sport: league.key,
            bookmakers: activeBookmakers.join(','),
            markets: activeMarkets.join(',')
          }
        });

        for (const event of oddsRes.data) {
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
      } catch (err: any) {
        console.warn(`Erro ao escanear liga ${league.title}:`, err.message);
      }
      
      // Pequeno delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    onProgress(`Scan Finalizado!`);
    return totalFound;

  } catch (error: any) {
    console.error('Erro no Scanner Manual:', error);
    throw error;
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
