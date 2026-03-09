import axios from 'axios';
import { cacheService } from './CacheService';
import { supabase } from '../lib/supabase';

export class OddsApiService {
  private readonly baseUrl = 'https://api.odds-api.io/v1';

  private async getApiKey(): Promise<string> {
    try {
      const { data } = await supabase.from('system_settings').select('odds_api_key').eq('id', 1).single();
      return data?.odds_api_key || process.env.ODDS_API_KEY || '';
    } catch (error) {
      console.error('[OddsApiService] Erro ao buscar API Key do banco:', error);
      return process.env.ODDS_API_KEY || '';
    }
  }

  /**
   * Busca a lista mestra de todos os esportes e ligas ativas na API
   */
  public async getActiveLeagues(): Promise<any[]> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return [];

      const response = await axios.get(`${this.baseUrl}/sports`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      this.logApiUsage(response.headers);
      return response.data; // Retorna array de objetos com { key, group, title, active... }
    } catch (error: any) {
      console.error(`[OddsApiService] Erro ao buscar lista de ligas:`, error.message);
      return [];
    }
  }

  public async getOddsForSport(sportKey: string, activeMarkets: string[], activeBookmakers: string[]): Promise<any[]> {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        console.error('[OddsApiService] ❌ ERRO CRÍTICO: Nenhuma chave de API configurada.');
        return [];
      }

      const marketsParam = activeMarkets.length > 0 ? activeMarkets.join(',') : 'h2h';
      const bookmakersParam = activeBookmakers.length > 0 ? activeBookmakers.join(',') : 'superbet,novibet';

      const response = await axios.get(`${this.baseUrl}/odds`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        params: {
          sport: sportKey,
          bookmakers: bookmakersParam,
          markets: marketsParam
        }
      });
      
      this.logApiUsage(response.headers);
      return response.data;
    } catch (error: any) {
      console.error(`[OddsApiService] Erro ao buscar odds para ${sportKey}:`, error.message);
      return [];
    }
  }

  private logApiUsage(headers: any) {
    const requestsRemaining = headers['x-ratelimit-remaining'] || headers['x-requests-remaining'];
    const requestsUsed = headers['x-ratelimit-used'] || headers['x-requests-used'];
    if (requestsUsed || requestsRemaining) {
      console.log(`[API Usage] Usadas: ${requestsUsed || '?'} | Restantes: ${requestsRemaining || '?'}`);
    }
  }
}

export const oddsApiService = new OddsApiService();
