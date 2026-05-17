import logger from '../config/logger';
import { BasicFormData, AdvancedFormData, RecommendationResult } from '../types/recommendation';
import { EmbeddingService } from './embeddingService';
import { VectorStoreService } from './vectorStoreService';
import { PromptAssemblyService } from './promptAssemblyService';
import { OpenRouterService } from './openRouterService';
import { RacketFilterService } from './racketFilterService';
import { RacketService } from './racketService';
import { CacheService } from './cacheService';
import { TesteaMetricsService } from './testeaMetricsService';

export class RagService {
  /**
   * Genera una recomendación usando el flujo RAG.
   */
  static async generateRecommendation(
    type: 'basic' | 'advanced',
    data: BasicFormData | AdvancedFormData
  ): Promise<RecommendationResult> {
    const startTime = Date.now();
    logger.info(`🚀 Starting RAG recommendation flow (${type})`);

    try {
      // 1. Check Cache
      const cacheHash = CacheService.generateProfileHash(data);
      const cachedResult = CacheService.get(cacheHash);
      if (cachedResult) {
        logger.info('⚡ RAG: Returning cached result');
        return cachedResult;
      }

      // 2. Filtro Biomecánico (Determinista)
      const allRackets = await RacketService.getAllRackets();
      const filteredRackets = RacketFilterService.filterRackets(allRackets, data);
      const safeRacketIds = filteredRackets.map(r => r.id as number);

      if (safeRacketIds.length === 0) {
        throw new Error('No safe rackets found for your profile.');
      }

      // 3. Build queries: HyDE (ideal racket description) + NL (player profile)
      // HyDE embeds in the same semantic space as racket_embeddings → better retrieval
      const hydeQuery = this.buildHyDEQuery(data);
      const nlQuery = this.buildNaturalLanguageQuery(data);
      logger.info(`🔍 RAG HyDE Query: "${hydeQuery}"`);
      logger.info(`🔍 RAG NL Query: "${nlQuery}"`);

      // 4. Embed both queries in parallel
      const [hydeEmbedding, nlEmbedding] = await Promise.all([
        EmbeddingService.embed(hydeQuery),
        EmbeddingService.embed(nlQuery),
      ]);

      logger.info(`📥 RAG: safeRacketIds count: ${safeRacketIds.length}`);

      // 5. Multi-query retrieval in parallel — merge and deduplicate by best similarity
      const [hydeRackets, nlRackets, knowledgeChunks] = await Promise.all([
        VectorStoreService.searchSimilarRackets(hydeEmbedding, {
          limit: 12,
          safeRacketIds,
        }),
        VectorStoreService.searchSimilarRackets(nlEmbedding, {
          limit: 10,
          safeRacketIds,
        }),
        VectorStoreService.searchKnowledge(hydeEmbedding, { limit: 6 }),
      ]);

      // Merge racket results: keep highest similarity per racketId, then take top 15
      const racketMap = new Map<number, (typeof hydeRackets)[0]>();
      [...hydeRackets, ...nlRackets].forEach(r => {
        const existing = racketMap.get(r.racketId);
        if (!existing || r.similarity > existing.similarity) {
          racketMap.set(r.racketId, r);
        }
      });
      const topRackets = Array.from(racketMap.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 15);

      // Retrieve reviews for top rackets
      const topRacketIds = topRackets.slice(0, 10).map(r => r.racketId);
      const relevantReviews = await VectorStoreService.searchRelevantReviews(hydeEmbedding, {
        limit: 8,
        racketIds: topRacketIds,
      });

      logger.info(
        `📥 Retrieved: ${topRackets.length} rackets, ${relevantReviews.length} reviews, ${knowledgeChunks.length} knowledge chunks`
      );

      if (topRackets.length > 0) {
        logger.info(`Top racket similarity: ${topRackets[0].similarity}`);
      }
      if (knowledgeChunks.length > 0) {
        logger.info(`Top knowledge similarity: ${knowledgeChunks[0].similarity}`);
      }

      // 6. Assemble Prompt
      const ragPrompt = PromptAssemblyService.buildRecommendationPrompt({
        userProfile: data,
        retrievedRackets: topRackets,
        relevantReviews: relevantReviews,
        knowledgeContext: knowledgeChunks,
        safeRacketCount: safeRacketIds.length,
        totalCatalog: allRackets.length,
      });

      // 7. LLM Call (OpenRouter)
      logger.info(`🤖 Sending RAG prompt to AI...`);
      const aiResponse = await OpenRouterService.generateContent(ragPrompt);

      // 8. Parse AI Response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response JSON');
      }
      const aiResult = JSON.parse(jsonMatch[0]);

      // 9. Enrich Recommendations (Using existing logic from RecommendationService or similar)
      const enrichedRackets = await this.enrichRAGResult(aiResult.rackets, filteredRackets, data);

      const result: RecommendationResult = {
        rackets: enrichedRackets,
        analysis: aiResult.analysis,
        process_summary: {
          total_catalog: allRackets.length,
          discarded_biomechanical: allRackets.length - filteredRackets.length,
          safe_evaluated: filteredRackets.length,
          main_criterion: this.getMainCriterion(data),
          rag_retrieved_count: topRackets.length,
        },
        transparency_note:
          'Recomendación generada mediante búsqueda semántica (RAG) en nuestro catálogo de palas y reviews.',
      };

      // 10. Cache + Return
      CacheService.set(cacheHash, result);

      const elapsed = Date.now() - startTime;
      logger.info(`✅ RAG: Recommendation generated in ${elapsed}ms`);

      return result;
    } catch (error) {
      logger.error('Error in RagService:', error);
      throw error;
    }
  }

  /**
   * HyDE (Hypothetical Document Embedding): genera una descripción de la pala IDEAL
   * en el mismo espacio semántico que los documentos de racket_embeddings.
   * Esto produce recuperaciones mucho más precisas que describir al jugador.
   */
  private static buildHyDEQuery(data: BasicFormData | AdvancedFormData): string {
    const parts: string[] = [];
    const adv = data as AdvancedFormData;
    const hasInjuries = data.injuries && data.injuries !== 'no';

    if (hasInjuries) {
      parts.push('forma redonda o lágrima', 'balance bajo o medio');
      parts.push('núcleo EVA Soft goma blanda', 'cara fibra de vidrio o carbono 3K');
      parts.push('dureza blanda', 'sistema antivibración', 'confort alto 9/10', 'manejabilidad alta 8/10');
    } else {
      const shapeFromStyle: Record<string, string> = {
        ofensivo: 'forma diamante o lágrima',
        defensivo: 'forma redonda',
        polivalente: 'forma lágrima',
      };
      const balanceFromStyle: Record<string, string> = {
        ofensivo: 'balance alto',
        defensivo: 'balance bajo',
        polivalente: 'balance medio',
      };

      if ('shape_preference' in adv && adv.shape_preference) {
        parts.push(`forma ${adv.shape_preference}`);
      } else if ('play_style' in adv && adv.play_style) {
        parts.push(shapeFromStyle[adv.play_style] || 'forma lágrima');
      }

      if ('balance_preference' in adv && adv.balance_preference) {
        parts.push(`balance ${adv.balance_preference}`);
      } else if ('play_style' in adv && adv.play_style) {
        parts.push(balanceFromStyle[adv.play_style] || 'balance medio');
      }
    }

    const touchMap: Record<string, string> = {
      blando: 'núcleo EVA Soft goma blanda salida de bola suave confort',
      duro: 'núcleo EVA Hard carbono 18K control potencia dura',
      medio: 'núcleo EVA equilibrado tacto medio',
    };
    parts.push(touchMap[data.touch_preference || ''] || 'núcleo EVA equilibrado');

    parts.push(`nivel ${data.level || 'intermedio'}`);

    const budget =
      typeof data.budget === 'object' && 'min' in (data.budget as any)
        ? `${(data.budget as any).min}-${(data.budget as any).max}`
        : `0-${data.budget}`;
    parts.push(`precio ${budget}€`);

    if ('weight_preference' in adv && adv.weight_preference) {
      parts.push(`peso ${adv.weight_preference}`);
    }

    if ('characteristic_priorities' in adv && adv.characteristic_priorities?.length) {
      const metricMap: Record<string, string> = {
        potencia: 'potencia alta 9/10',
        control: 'control alto 9/10',
        manejabilidad: 'manejabilidad alta 9/10',
        salida_de_bola: 'salida de bola alta',
        punto_dulce: 'punto dulce amplio centrado',
      };
      adv.characteristic_priorities.slice(0, 2).forEach(p => {
        if (metricMap[p]) parts.push(metricMap[p]);
      });
    }

    return `Pala de pádel ideal: ${parts.join(', ')}.`;
  }

  private static buildNaturalLanguageQuery(data: BasicFormData | AdvancedFormData): string {
    const level = data.level || 'intermedio';
    const injuries =
      data.injuries && data.injuries !== 'no' ? `con lesión en ${data.injuries}` : 'sin lesiones';
    const budget =
      typeof data.budget === 'object' && 'min' in (data.budget as any)
        ? `${(data.budget as any).min}-${(data.budget as any).max}€`
        : `${data.budget}€`;
    const touch = data.touch_preference ? `tacto ${data.touch_preference}` : '';
    const gender = data.gender ? `jugador ${data.gender}` : 'jugador';
    const condition = data.physical_condition ? `, condición física ${data.physical_condition}` : '';

    let query = `${gender} nivel ${level}${condition}, ${injuries}, presupuesto ${budget}. Busca pala ${touch}.`;

    if ('play_style' in data) {
      const adv = data as AdvancedFormData;
      const style = adv.play_style || 'polivalente';
      const position = adv.position ? ` Posición: ${adv.position}.` : '';
      const years = adv.years_playing ? ` ${adv.years_playing} años jugando.` : '';
      const bestShot = adv.best_shot ? ` Mejor golpe: ${adv.best_shot}.` : '';
      const weakShot = adv.weak_shot ? ` Golpe a mejorar: ${adv.weak_shot}.` : '';
      const objectives = adv.objectives?.length ? ` Objetivos: ${adv.objectives.join(', ')}.` : '';
      const priorities = adv.characteristic_priorities?.length
        ? ` Prioridades: ${adv.characteristic_priorities.join(', ')}.`
        : '';
      const likes = adv.current_racket_likes ? ` Le gusta de su pala: ${adv.current_racket_likes}.` : '';
      const dislikes = adv.current_racket_dislikes
        ? ` No le gusta de su pala: ${adv.current_racket_dislikes}.`
        : '';

      query += ` Estilo ${style}.${position}${years}${bestShot}${weakShot}${objectives}${priorities}${likes}${dislikes}`;
    }

    if (data.current_racket) {
      query += ` Actualmente usa la ${data.current_racket}.`;
    }

    return query.replace(/\s+/g, ' ').trim();
  }

  private static async enrichRAGResult(
    aiRackets: any[],
    filteredRackets: any[],
    profile: any
  ): Promise<any[]> {
    // Reuse enrichment logic (simplified version of RecommendationService.enrichRecommendations)
    return aiRackets
      .map(rec => {
        const racket = filteredRackets.find(r => r.id === rec.id);
        if (!racket) return null;

        const metrics = TesteaMetricsService.getTesteaMetrics(racket);

        return {
          id: racket.id,
          name: racket.nombre,
          brand: racket.marca,
          image: racket.imagenes?.[0] || null,
          price: racket.precio_actual,
          match_score: rec.match_score,
          reason: rec.reason,
          testea_metrics: metrics,
          match_details: {
            priority_alignment: rec.priority_alignment,
            biomechanical_fit: rec.biomechanical_fit,
            preference_match: rec.preference_match,
          },
          community_data: {
            user_rating: racket.valoracion_usuarios,
            is_bestseller: racket.es_bestseller,
          },
        };
      })
      .filter(r => r !== null);
  }

  private static getMainCriterion(profile: any): string {
    if (profile.characteristic_priorities?.length > 0) {
      return profile.characteristic_priorities[0].toUpperCase();
    }
    return 'SIMILITUD SEMÁNTICA';
  }
}
