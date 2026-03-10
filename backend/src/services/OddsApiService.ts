import axios from 'axios';
import { cacheService } from './CacheService';
import { supabase } from '../lib/supabase';

export class OddsApiService {
  private async getApiConfig() {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('odds_api_key, api_base_url, api_endpoint_odds')
        .eq('id', 1)
        .single();
        
      return {
        key: data?.odds_api_key || process.env.ODDS_API_KEY || '',
        baseUrl: data?.api_base_url ? data.api_base_url.replace(/\/$/, '') : 'https://api.odds-api.io/v1',
        endpoint: data?.api_endpoint_odds ? (data.api_endpoint_odds.startsWith('/') ? data.api_endpoint_odds : `/${data.api_endpoint_odds}`) : '/odds'
      };
    } catch (error) {
      console.error('[OddsApiService] Erro ao buscar configurações da API:', error);
      return {
        key: process.env.ODDS_API_KEY || '',
        baseUrl: 'https://api.odds-api.io/v1',
        endpoint: '/odds'
      };
    }
  }

  public async getActiveLeagues(): Promise<any[]> {
    try {
      const config = await this.getApiConfig();
      if (!config.key) return [];

      // Tenta buscar a lista de esportes (pode falhar dependendo da API do usuário)
      const response = await axios.get(`${config.baseUrl}/sports`, {
        headers: {
          'Authorization': `Bearer ${config.key}`,
          'Accept': 'application/json'
        }
      });
      
      this.logApiUsage(response.headers);
      return response.data;
    } catch (error: any) {
      console.warn(`[OddsApiService] Aviso: Rota /sports não encontrada ou não autorizada. O motor usará fallback global.`);
      return [];
    }
  }

  public async getOddsForSport(sportKey: string, activeMarkets: string[], activeBookmakers: string[]): Promise<any[]> {
    try {
      const config = await this.getApiConfig();
      
      if (!config.key) {
        console.error('[OddsApiService] ❌ ERRO CRÍTICO: Nenhuma chave de API configurada.');
        return [];
      }

      const marketsParam = activeMarkets.length > 0 ? activeMarkets.join(',') : 'h2h';
      const bookmakersParam = activeBookmakers.length > 0 ? activeBookmakers.join(',') : 'superbet,novibet';

      const fullUrl = `${config.baseUrl}${config.endpoint}`;

      const response = await axios.get(fullUrl, {
        headers: {
          'Authorization': `Bearer ${config.key}`,
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
      console.error(`[OddsApiService] Erro ao buscar odds em ${config.baseUrl}${config.endpoint}:`, error.message);
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
