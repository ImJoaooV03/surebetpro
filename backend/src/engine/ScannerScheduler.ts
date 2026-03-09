import { oddsApiService } from '../services/OddsApiService';
import { ArbitrageEngine, SurebetOpportunity } from './ArbitrageEngine';
import { supabase } from '../lib/supabase';

export class ScannerScheduler {
  private isRunning = false;

  constructor() {
    console.log(`[Scanner] Inicializado. Aguardando partida...`);
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Scanner] Motor de busca ativado.');
    this.runCycle();
  }

  private async runCycle() {
    while (this.isRunning) {
      const cycleStartTime = Date.now();

      try {
        const { data: settings } = await supabase.from('system_settings').select('*').single();
        const intervalSeconds = settings?.scan_interval_seconds || 600;
        const minRoi = settings?.min_roi || 1.0;

        const { data: sports } = await supabase.from('sports').select('key').eq('active', true);
        const activeSportGroups = sports?.map(s => s.key.toLowerCase()) || [];

        const { data: markets } = await supabase.from('markets').select('key').eq('active', true);
        const activeMarkets = markets?.map(m => m.key) || ['h2h'];

        const { data: bookmakers } = await supabase.from('bookmakers').select('key').eq('active', true);
        const activeBookmakers = bookmakers?.map(b => b.key) || ['superbet', 'novibet'];

        console.log(`\n[Scanner] 🔄 Iniciando novo ciclo de busca...`);
        
        if (activeBookmakers.length < 2) {
          console.log(`[Scanner] AVISO: Menos de 2 casas de apostas ativas. Arbitragem impossível.`);
        } else if (activeSportGroups.length === 0) {
          console.log(`[Scanner] Nenhum grupo de esporte ativo. Pulando ciclo.`);
        } else {
          console.log(`[Scanner] Consultando API para descobrir todas as ligas ativas no mundo...`);
          const allApiSports = await oddsApiService.getActiveLeagues();

          const leaguesToScan = allApiSports.filter(apiSport => 
            activeSportGroups.includes(apiSport.group.toLowerCase())
          );

          console.log(`[Scanner] Mapeamento concluído: ${leaguesToScan.length} ligas encontradas para os esportes selecionados.`);

          for (const league of leaguesToScan) {
            console.log(`[Scanner] Buscando odds para a liga: ${league.title} (${league.key})...`);
            
            const events = await oddsApiService.getOddsForSport(league.key, activeMarkets, activeBookmakers);
            let foundInLeague = 0;

            for (const event of events) {
              const commenceTime = new Date(event.commence_time).getTime();
              if (commenceTime <= Date.now()) continue; 

              const opportunities = ArbitrageEngine.analyzeEvent(event);
              
              for (const opp of opportunities) {
                if (opp.roi >= minRoi) {
                  foundInLeague++;
                  await this.saveOpportunityToDb(opp);
                }
              }
            }
            
            if (foundInLeague > 0) {
              console.log(`[Engine] 🔥 ${foundInLeague} surebets salvas em ${league.title}!`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const elapsed = Date.now() - cycleStartTime;
        const sleepTime = Math.max(0, (intervalSeconds * 1000) - elapsed);
        
        console.log(`[Scanner] ✅ Ciclo concluído. Aguardando ${Math.round(sleepTime / 1000)}s para o próximo ciclo...`);
        await new Promise(resolve => setTimeout(resolve, sleepTime));

      } catch (error) {
        console.error(`[Scanner] Erro crítico no ciclo:`, error);
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
  }

  private async saveOpportunityToDb(opp: SurebetOpportunity) {
    try {
      // Salva o evento com a nova coluna league_title
      await supabase.from('events').upsert({
        id: opp.eventId,
        sport_key: opp.sportKey,
        league_title: opp.leagueTitle, // Salva o nome da liga (ex: Premier League)
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

      if (oppError || !savedOpp) throw oppError;

      const legsToInsert = opp.legs.map(leg => ({
        opportunity_id: savedOpp.id,
        outcome_name: leg.outcomeName,
        bookmaker: leg.bookmaker,
        price: leg.price,
        stake_percentage: leg.stakePercentage
      }));

      await supabase.from('surebet_legs').insert(legsToInsert);

    } catch (error) {
      console.error(`[DB] Erro ao salvar oportunidade:`, error);
    }
  }
}

export const scannerScheduler = new ScannerScheduler();
