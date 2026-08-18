import { describe, it, expect } from 'vitest';
import { scrubUrl, redactSecrets, firstOwnFrame } from '@/utils/errorReporter';

describe('errorReporter scrubbing', () => {
  describe('scrubUrl', () => {
    it('strips the OAuth callback hash carrying a live access token', () => {
      const url =
        'https://smashly.app/auth/callback#access_token=eyJhbGciOiJIUzI1NiJ9.abc.def&type=recovery';
      expect(scrubUrl(url)).toBe('/auth/callback');
    });

    it('strips a query string not in the allowlist', () => {
      expect(scrubUrl('https://smashly.app/comparador?token=reset-secret')).toBe('/comparador');
    });

    it('leaves a bare pathname untouched', () => {
      expect(scrubUrl('https://smashly.app/palas/nox-ml10')).toBe('/palas/nox-ml10');
    });
  });

  describe('redactSecrets', () => {
    it('redacts a JWT', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(redactSecrets(`401 Unauthorized: ${jwt}`)).toBe('401 Unauthorized: [REDACTED]');
    });

    it('redacts a Bearer token', () => {
      expect(redactSecrets('Authorization: Bearer sk-abcdef1234567890')).toBe(
        'Authorization: Bearer [REDACTED]'
      );
    });

    it('redacts an email', () => {
      expect(redactSecrets('failed for user cristian.teijeiro@fusuma.io')).toBe(
        'failed for user [REDACTED]'
      );
    });

    it('leaves an ordinary message untouched', () => {
      expect(redactSecrets('Cannot read properties of undefined')).toBe(
        'Cannot read properties of undefined'
      );
    });
  });

  describe('firstOwnFrame', () => {
    it('skips vendor/node_modules frames and picks the first own-code frame', () => {
      const stack = [
        'TypeError: boom',
        '    at Object.<anonymous> (/node_modules/react-dom/cjs/react-dom.development.js:123:45)',
        '    at ComparisonTable (/assets/ComparisonTable-abc123.js:1:4821)',
        '    at renderWithHooks (/node_modules/react-dom/cjs/react-dom.development.js:456:78)',
      ].join('\n');
      const frame = firstOwnFrame(stack);
      expect(frame?.file).toBe('/assets/ComparisonTable-abc123.js');
      expect(frame?.line).toBe(1);
    });

    it('falls back to the first frame when every frame looks like vendor code', () => {
      const stack = [
        'Error: boom',
        '    at f (/node_modules/foo/index.js:1:1)',
        '    at g (/assets/vendor-react-abc.js:2:2)',
      ].join('\n');
      const frame = firstOwnFrame(stack);
      expect(frame?.file).toBe('/node_modules/foo/index.js');
    });
  });
});
