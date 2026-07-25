import { describe, it, expect } from 'vitest';

describe('App Component', () => {
  it('should import App without errors', async () => {
    const mod = await import('@/App');
    expect(mod).toBeDefined();
  });
});
