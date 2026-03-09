// backend/src/services/CacheService.ts
/**
 * Serviço de Cache em Memória com TTL (Time-To-Live)
 * Essencial para evitar requisições duplicadas e economizar a cota da API.
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Define um valor no cache
   * @param key Chave única
   * @param value Valor a ser armazenado
   * @param ttlSeconds Tempo de vida em segundos (Padrão: 5 minutos)
   */
  public set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Recupera um valor do cache se não estiver expirado
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
