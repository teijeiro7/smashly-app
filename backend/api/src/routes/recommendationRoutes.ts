import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { authenticateUser as authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { aiLimiter } from '../middleware/rateLimits';

const router: Router = Router();

// Debug: log every request hitting this router
router.use((req, _res, next) => {
  console.log(`[recommendations router] ${req.method} ${req.path}`);
  next();
});

// Public AI endpoints (rate limited by IP for guests, by user ID when authenticated)
router.post('/generate', aiLimiter, RecommendationController.generate);
router.post('/generate-rag', aiLimiter, RecommendationController.generateWithRAG);

// Protected routes
router.post('/save', authenticate, RecommendationController.save);
router.get('/last', authenticate, RecommendationController.getLast);

// Cache management — admin only
router.post('/cache/clear', authenticate, requireAdmin, RecommendationController.clearCache);
router.get('/cache/stats', authenticate, requireAdmin, RecommendationController.getCacheStats);

export default router;
