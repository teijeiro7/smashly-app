import { BasicFormData, AdvancedFormData } from '../types/recommendation';
import { TesteaMetricsService } from './testeaMetricsService';

/**
 * Servicio para comprimir prompts y reducir el tamaño enviado al AI
 * Esto evita que el Worker de Cloudflare exceda sus límites de recursos
 */
export class PromptCompressionService {
  /**
   * Comprime una pala a formato ultra-compacto
   * Formato: id|marca|nombre|nivel|forma|balance|precio|P:C:M:Conf:cert
   */
  static compressRacket(racket: any): string {
    const metrics = TesteaMetricsService.getTesteaMetrics(racket);
    return [
      racket.id,
      this.abbreviate(racket.marca, 3),
      this.abbreviate(racket.nombre, 20),
      this.abbreviateLevel(racket.caracteristicas_nivel_de_juego),
      this.abbreviateShape(racket.caracteristicas_forma),
      this.abbreviateBalance(racket.caracteristicas_balance),
      Math.round(racket.precio_actual || 0),
      `${metrics.potencia}:${metrics.control}:${metrics.manejabilidad}:${metrics.confort}:${metrics.certificado ? 1 : 0}`,
    ].join('|');
  }

  /**
   * Comprime el perfil del usuario a formato compacto
   */
  static compressProfile(profile: BasicFormData | AdvancedFormData): string {
    const parts: string[] = [
      `L:${this.abbreviateLevel(profile.level)}`,
      `F:${profile.frequency}`,
      `I:${profile.injuries === 'no' ? 0 : 1}`,
      `B:${this.formatBudget(profile.budget)}`,
      `G:${profile.gender?.charAt(0) || 'X'}`,
      `C:${this.abbreviateCondition(profile.physical_condition || '')}`,
      `T:${this.abbreviateTouch(profile.touch_preference || '')}`,
    ];

    if ('play_style' in profile && profile.play_style) {
      parts.push(`S:${this.abbreviateStyle(profile.play_style)}`);
    }

    if ('characteristic_priorities' in profile && profile.characteristic_priorities?.length) {
      parts.push(`P:${profile.characteristic_priorities.map(p => p.charAt(0).toUpperCase()).join('')}`);
    }

    return parts.join(',');
  }

  /**
   * Genera un prompt compacto para selección de palas
   * Enviar 10-12 palas comprimidas en lugar de 15-20 completas
   */
  static buildCompactSelectionPrompt(
    rackets: any[],
    profile: BasicFormData | AdvancedFormData
  ): string {
    const compressedRackets = rackets.map(r => this.compressRacket(r)).join('\n');
    const compressedProfile = this.compressProfile(profile);

    return `S:Eres Smashly,experto pádel.Seguridad biomecánica primero.T:Verdad objetiva con métricas Testea.
U:${compressedProfile}
C:${rackets.length} palas seguras:
ID|M|Modelo|Nivel|Forma|Balance|€|P:C:M:Conf:Cert
${compressedRackets}
I:1.Selecciona EXACTAMENTE 3 palas del catálogo.2.Usa SOLO IDs proporcionados.3.Ordena por mejor match.4.Explicaciones ESPECÍFICAS con datos concretos.
R:{"rackets":[{"id":ID,"match_score":0-100,"reason":"2-3 frases específicas","what_it_gives_you":"3-4 beneficios","what_it_sacrifices":"qué cede","priority_alignment":"métricas prioritarias","biomechanical_fit":"por qué es segura","ideal_for_moment":"situaciones de juego"}],"analysis":"resumen","coaching_tip":"consejo técnico"}`;
  }

  // Métodos de abreviación privados
  private static abbreviate(text: string, maxLength: number): string {
    if (!text) return 'NA';
    return text.length > maxLength ? text.substring(0, maxLength) : text;
  }

  private static abbreviateLevel(level: string): string {
    const map: Record<string, string> = {
      'principiante': 'PRIN',
      'iniciación': 'INIC',
      'intermedio': 'INT',
      'avanzado': 'AVZ',
      'pro': 'PRO',
      'profesional': 'PROF',
    };
    return map[level?.toLowerCase()] || 'NA';
  }

  private static abbreviateShape(shape: string): string {
    const map: Record<string, string> = {
      'redonda': 'R',
      'lágrima': 'L',
      'gota': 'G',
      'diamante': 'D',
    };
    return map[shape?.toLowerCase()] || 'NA';
  }

  private static abbreviateBalance(balance: string): string {
    const map: Record<string, string> = {
      'bajo': 'B',
      'medio': 'M',
      'alto': 'A',
      'neutro': 'N',
    };
    return map[balance?.toLowerCase()] || 'NA';
  }

  private static abbreviateCondition(condition: string): string {
    const map: Record<string, string> = {
      'ocasional': 'OC',
      'asiduo': 'AS',
      'buena': 'B',
      'muy_buena': 'MB',
    };
    return map[condition?.toLowerCase()] || 'NA';
  }

  private static abbreviateTouch(touch: string): string {
    const map: Record<string, string> = {
      'blando': 'BL',
      'medio': 'M',
      'duro': 'D',
    };
    return map[touch?.toLowerCase()] || 'NA';
  }

  private static abbreviateStyle(style: string): string {
    const map: Record<string, string> = {
      'ofensivo': 'OF',
      'defensivo': 'DF',
      'control': 'CT',
      'polivalente': 'PL',
    };
    return map[style?.toLowerCase()] || 'NA';
  }

  private static formatBudget(budget: any): string {
    if (typeof budget === 'object' && budget !== null) {
      return `${budget.min}-${budget.max}`;
    }
    return String(budget);
  }
}