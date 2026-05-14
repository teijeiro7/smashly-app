import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import type { RequestWithUser } from '../types';

export function aiKeyGenerator(req: Request): string {
  const user = (req as RequestWithUser).user;
  return user?.id ?? req.ip ?? 'anonymous';
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    error: 'Demasiados intentos. Por favor, espere un minuto.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: aiKeyGenerator,
  message: {
    error: 'Too many AI requests. Please wait before trying again.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const proxyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    error: 'Too many image proxy requests.',
    code: 'PROXY_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const comparisonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many comparison requests. Please wait before trying again.',
    code: 'COMPARISON_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
