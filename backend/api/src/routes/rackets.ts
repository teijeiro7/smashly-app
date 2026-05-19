import { Router } from 'express';
import { RacketController } from '../controllers/racketController';
import { optionalAuth, authenticateUser } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { requireRacketOwner } from '../middleware/requireRacketOwner';
import {
  validatePagination,
  validateIdParam,
  validateSearchQuery,
  validateSearchFilters,
} from '../middleware/validation';

const router: Router = Router();

// GET /api/rackets - Gets all rackets or with pagination
router.get('/', optionalAuth, validatePagination, RacketController.getAllRackets);

// GET /api/rackets/search?q=... - Searches rackets by name, brand or model
router.get('/search', optionalAuth, validateSearchQuery, RacketController.searchRackets);

// GET /api/rackets/filter - Gets rackets with advanced filters
router.get(
  '/filter',
  optionalAuth,
  validatePagination,
  validateSearchFilters,
  RacketController.getFilteredRackets
);

// GET /api/rackets/bestsellers - Gets bestseller rackets
router.get('/bestsellers', optionalAuth, RacketController.getBestsellerRackets);

// GET /api/rackets/offers - Gets rackets on sale
router.get('/offers', optionalAuth, RacketController.getRacketsOnSale);

// GET /api/rackets/brands - Gets all available brands
router.get('/brands', optionalAuth, RacketController.getBrands);

// GET /api/rackets/stats - Gets racket statistics
router.get('/stats', optionalAuth, RacketController.getStats);

// GET /api/rackets/brands/:brand - Gets rackets by specific brand
router.get('/brands/:brand', optionalAuth, RacketController.getRacketsByBrand);

// GET /api/rackets/by-name/:nombre - Gets a racket by name (exact match, case-insensitive)
// Used for backward compatibility with old name-based URLs
router.get('/by-name/:nombre', optionalAuth, RacketController.getRacketByName);

// GET /api/rackets/:id/price-history - Historial de precios de una pala
// Query params: days (default 90), store (opcional)
router.get('/:id/price-history', optionalAuth, validateIdParam(), RacketController.getRacketPriceHistory);

// GET /api/rackets/:id - Gets a racket by ID (must go at the end)
router.get('/:id', optionalAuth, validateIdParam(), RacketController.getRacketById);

// PUT /api/rackets/:id - Updates a racket (admin or store owner)
router.put('/:id', authenticateUser, requireRacketOwner, validateIdParam(), RacketController.updateRacket);

// DELETE /api/rackets/:id - Deletes a racket (admin or store owner)
router.delete('/:id', authenticateUser, requireRacketOwner, validateIdParam(), RacketController.deleteRacket);

// POST /api/rackets/bulk-update - Bulk updates rackets (admin only)
router.post('/bulk-update', authenticateUser, requireAdmin, RacketController.bulkUpdateRackets);

export default router;
