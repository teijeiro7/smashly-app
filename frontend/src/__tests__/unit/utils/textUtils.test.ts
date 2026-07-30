import { describe, it, expect } from 'vitest';
import { toTitleCase, formatBrandName, formatModelName, formatRacketName } from '@/utils/textUtils';

describe('textUtils', () => {
  describe('formatBrandName', () => {
    it('should format special brand names correctly', () => {
      expect(formatBrandName('nox')).toBe('NOX');
      expect(formatBrandName('starvie')).toBe('StarVie');
      expect(formatBrandName('star vie')).toBe('StarVie');
      expect(formatBrandName('drop shot')).toBe('Drop Shot');
      expect(formatBrandName('black crown')).toBe('Black Crown');
      expect(formatBrandName('royal padel')).toBe('Royal Padel');
      expect(formatBrandName('babolat')).toBe('Babolat');
      expect(formatBrandName('bullpadel')).toBe('Bullpadel');
      expect(formatBrandName('adidas')).toBe('Adidas');
      expect(formatBrandName('head')).toBe('Head');
      expect(formatBrandName('siux')).toBe('Siux');
    });

    it('should handle empty or null values', () => {
      expect(formatBrandName('')).toBe('');
      expect(formatBrandName(null)).toBe('');
      expect(formatBrandName(undefined)).toBe('');
    });
  });

  describe('toTitleCase / formatModelName', () => {
    it('should format model names with technical spec acronyms', () => {
      expect(toTitleCase('ml10 pro cup 3k 2024')).toBe('ML10 PRO Cup 3K 2024');
      expect(formatModelName('technical viper 12k')).toBe('Technical Viper 12K');
      expect(formatModelName('vertex 04 hrd+ ctrl')).toBe('Vertex 04 HRD+ CTRL');
      expect(formatModelName('metalbone 3.1 ltd')).toBe('Metalbone 3.1 LTD');
    });

    it('should handle empty strings', () => {
      expect(toTitleCase('')).toBe('');
      expect(toTitleCase(null)).toBe('');
    });
  });

  describe('formatRacketName', () => {
    it('should format full racket name combining brand and model without duplication', () => {
      expect(
        formatRacketName({
          marca: 'nox',
          modelo: 'ml10 pro cup 3k 2024',
        })
      ).toBe('NOX ML10 PRO Cup 3K 2024');

      expect(
        formatRacketName({
          marca: 'babolat',
          modelo: 'babolat technical viper 2024',
        })
      ).toBe('Babolat Technical Viper 2024');

      expect(
        formatRacketName({
          marca: 'bullpadel',
          nombre: 'bullpadel vertex 04 ctrl',
        })
      ).toBe('Bullpadel Vertex 04 CTRL');
    });

    it('should handle string input', () => {
      expect(formatRacketName('nox ml10 pro cup 3k')).toBe('NOX ML10 PRO Cup 3K');
    });

    it('should handle null / empty inputs gracefully', () => {
      expect(formatRacketName(null)).toBe('');
      expect(formatRacketName({})).toBe('');
    });
  });
});
