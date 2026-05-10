import { describe, it, expect } from 'vitest';
import {
  globalLimiter,
  authLimiter,
  aiLimiter,
  proxyLimiter,
  comparisonLimiter,
  aiKeyGenerator,
} from '../../middleware/rateLimits';
import type { Request } from 'express';
import type { RequestWithUser } from '../../types';

describe('rateLimits — exports', () => {
  it('globalLimiter is an Express middleware function', () => {
    expect(typeof globalLimiter).toBe('function');
  });
  it('authLimiter is an Express middleware function', () => {
    expect(typeof authLimiter).toBe('function');
  });
  it('aiLimiter is an Express middleware function', () => {
    expect(typeof aiLimiter).toBe('function');
  });
  it('proxyLimiter is an Express middleware function', () => {
    expect(typeof proxyLimiter).toBe('function');
  });
  it('comparisonLimiter is an Express middleware function', () => {
    expect(typeof comparisonLimiter).toBe('function');
  });
});

describe('aiKeyGenerator', () => {
  it('returns user.id when authenticated', () => {
    const req = { user: { id: 'user-abc', email: '', role: 'player' }, ip: '1.2.3.4' } as RequestWithUser;
    expect(aiKeyGenerator(req as unknown as Request)).toBe('user-abc');
  });

  it('falls back to IP when no user', () => {
    const req = { ip: '5.6.7.8' } as Request;
    expect(aiKeyGenerator(req)).toBe('5.6.7.8');
  });

  it('returns "anonymous" when no user and no IP', () => {
    const req = {} as Request;
    expect(aiKeyGenerator(req)).toBe('anonymous');
  });
});
