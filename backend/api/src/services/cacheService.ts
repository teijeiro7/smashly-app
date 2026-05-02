import NodeCache from 'node-cache';
import crypto from 'crypto';
import logger from '../config/logger';
import { RecommendationResult, BasicFormData, AdvancedFormData } from '../types/recommendation';
import { Racket } from '../types';

/**
 * Cache service for storing recommendation results
 * Uses in-memory cache with TTL
 */
export class CacheService {
  // Recommendation cache (7 days TTL)
  private static cache = new NodeCache({
    stdTTL: 604800, // 7 days in seconds
    checkperiod: 3600, // Check for expired keys every hour
    useClones: false, // Don't clone objects for better performance
  });

  // Catalog cache (1 hour TTL — enough since prices update weekly)
  private static CATALOG_KEY = 'catalog_rackets';
  private static CATALOG_VERSION_KEY = 'catalog_version';
  private static catalogCache = new NodeCache({
    stdTTL: 3600, // 1 hour
    checkperiod: 300, // Check expired every 5 min
    useClones: false,
  });

  // --- Catalog Caching ---

  /**
   * Guarda el catálogo completo de palas en caché
   */
  static setCatalog(rackets: Racket[]): void {
    this.catalogCache.set<Racket[]>(this.CATALOG_KEY, rackets);
    logger.info(`💾 Catálogo cacheado (${rackets.length} palas)`);
  }

  /**
   * Obtiene el catálogo completo de palas desde caché
   */
  static getCatalog(): Racket[] | null {
    const cached = this.catalogCache.get<Racket[]>(this.CATALOG_KEY);
    if (cached) {
      logger.info(`✅ Catálogo HIT (${cached.length} palas desde RAM)`);
      return cached;
    }
    logger.info('❌ Catálogo MISS');
    return null;
  }

  /**
   * Guarda la versión/hash actual del catálogo (basado en max updated_at)
   */
  static setCatalogVersion(version: string): void {
    this.catalogCache.set<string>(this.CATALOG_VERSION_KEY, version);
    logger.info(`💾 Versión de catálogo cacheada: ${version}`);
  }

  /**
   * Obtiene la versión/hash actual del catálogo
   */
  static getCatalogVersion(): string | null {
    return this.catalogCache.get<string>(this.CATALOG_VERSION_KEY) || null;
  }

  /**
   * Invalida la caché del catálogo (llamar tras actualizaciones/imports)
   */
  static invalidateCatalog(): void {
    this.catalogCache.del(this.CATALOG_KEY);
    this.catalogCache.del(this.CATALOG_VERSION_KEY);
    logger.info('🗑️  Caché de catálogo invalidada');
  }

  /**
   * Generate a unique hash for a user profile
   * Similar profiles will have the same hash
   */
  static generateProfileHash(data: BasicFormData | AdvancedFormData): string {
    // Extract ALL fields that define the profile
    // ANY change in these fields should generate a different recommendation
    const essentialData: any = {
      level: data.level,
      budget: data.budget,
      injuries: data.injuries,
      frequency: data.frequency,
      // Optional basic fields that affect recommendations
      gender: data.gender,
      physical_condition: data.physical_condition,
      touch_preference: data.touch_preference,
      aesthetic_preference: data.aesthetic_preference,
      current_racket: data.current_racket,
    };

    // For advanced forms, include additional fields
    if ('play_style' in data) {
      essentialData.play_style = data.play_style;
      essentialData.position = data.position;
      essentialData.balance_preference = data.balance_preference;
      essentialData.shape_preference = data.shape_preference;
      essentialData.years_playing = data.years_playing;
      essentialData.best_shot = data.best_shot;
      essentialData.weak_shot = data.weak_shot;
      essentialData.weight_preference = data.weight_preference;
      essentialData.current_racket_likes = data.current_racket_likes;
      essentialData.current_racket_dislikes = data.current_racket_dislikes;
      essentialData.objectives = data.objectives;
      essentialData.characteristic_priorities = data.characteristic_priorities;
    }

    // Create deterministic string from essential data
    const dataString = JSON.stringify(essentialData, Object.keys(essentialData).sort());

    // Generate MD5 hash
    const hash = crypto.createHash('md5').update(dataString).digest('hex');

    logger.debug(`Generated cache hash: ${hash} for profile: ${dataString}`);
    return hash;
  }

  /**
   * Get cached recommendation result
   */
  static get(hash: string): RecommendationResult | null {
    const cached = this.cache.get<RecommendationResult>(hash);

    if (cached) {
      logger.info(`✅ Cache HIT for hash: ${hash}`);
      return cached;
    }

    logger.info(`❌ Cache MISS for hash: ${hash}`);
    return null;
  }

  /**
   * Store recommendation result in cache
   */
  static set(hash: string, result: RecommendationResult): void {
    this.cache.set(hash, result);
    logger.info(`💾 Cached recommendation for hash: ${hash}`);
  }

  /**
   * Clear all caches (recommendations + catalog)
   */
  static clearAll(): void {
    this.cache.flushAll();
    this.catalogCache.flushAll();
    logger.info('🗑️  Todas las cachés limpiadas');
  }

  /**
   * Get cache statistics for both caches
   */
  static getStats() {
    const stats = this.cache.getStats();
    const catalogStats = this.catalogCache.getStats();
    return {
      recommendations: {
        keys: this.cache.keys().length,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      },
      catalog: {
        keys: this.catalogCache.keys().length,
        hits: catalogStats.hits,
        misses: catalogStats.misses,
        hitRate: catalogStats.hits / (catalogStats.hits + catalogStats.misses) || 0,
      },
    };
  }
}
