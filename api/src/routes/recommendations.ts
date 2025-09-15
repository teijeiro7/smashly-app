import { Router } from "express";
import { RecommendationController } from "../controllers/recommendationController";
import { optionalAuth, authenticateUser } from "../middleware/auth";
import { validateBody, schemas } from "../middleware/validation";

const router = Router();

// POST /api/recommendations - Obtiene recomendaciones de palas
router.post(
  "/",
  optionalAuth,
  validateBody(schemas.recommendation),
  RecommendationController.getRecommendations
);

// POST /api/recommendations/compare - Compara múltiples palas
router.post(
  "/compare",
  optionalAuth,
  validateBody(schemas.compareRackets),
  RecommendationController.compareRackets
);

// GET /api/recommendations/history - Obtiene historial de recomendaciones
router.get(
  "/history",
  authenticateUser,
  RecommendationController.getRecommendationHistory
);

// POST /api/recommendations/interaction - Registra interacción del usuario
router.post(
  "/interaction",
  authenticateUser,
  validateBody(schemas.userInteraction),
  RecommendationController.recordInteraction
);

// POST /api/recommendations/validate-form - Valida formulario
router.post(
  "/validate-form",
  validateBody(schemas.recommendation),
  RecommendationController.validateForm
);

export default router;
