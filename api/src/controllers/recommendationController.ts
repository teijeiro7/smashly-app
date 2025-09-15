import { Request, Response } from "express";
import { RecommendationService } from "../services/recommendationService";
import { RacketService } from "../services/racketService";
import {
  FormData,
  MultipleRacketRecommendations,
  RacketComparison,
  ApiResponse,
  RequestWithUser,
} from "../types";

export class RecommendationController {
  /**
   * POST /api/recommendations
   * Obtiene recomendaciones de palas basadas en el perfil del usuario
   */
  static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const formData: FormData = req.body as FormData;

      // Validar datos del formulario
      const validation = RecommendationService.validateFormData(formData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: "Datos del formulario inválidos",
          message: validation.errors.join(", "),
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      // Obtener todas las palas para el análisis
      console.log("🔍 Obteniendo base de datos de palas...");
      const racketDatabase = await RacketService.getAllRackets();

      if (racketDatabase.length === 0) {
        res.status(404).json({
          success: false,
          error: "Base de datos vacía",
          message: "No hay palas disponibles para generar recomendaciones",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      console.log(
        `📊 Generando recomendaciones con ${racketDatabase.length} palas...`
      );

      // Generar recomendaciones con IA
      const recommendations =
        await RecommendationService.getRacketRecommendations(
          formData,
          racketDatabase
        );

      // Store user interaction if user is authenticated
      const userId = (req as RequestWithUser).user?.id;
      if (userId) {
        try {
          await RecommendationService.storeUserInteraction(
            userId,
            0, // General recommendation request
            "recommend",
            undefined,
            {
              formData,
              recommendationCount: recommendations.recommendations.length,
            }
          );
        } catch (error) {
          console.warn("Failed to store user interaction:", error);
          // Don't fail the request if interaction storage fails
        }
      }

      res.json({
        success: true,
        data: recommendations,
        message: `${recommendations.recommendations.length} recomendaciones generadas exitosamente`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<MultipleRacketRecommendations>);
    } catch (error: any) {
      console.error("Error in getRecommendations:", error);

      // Manejar errores específicos de la IA
      if (
        error.message.includes("API key") ||
        error.message.includes("Gemini")
      ) {
        res.status(503).json({
          success: false,
          error: "Servicio de IA no disponible",
          message:
            "El servicio de recomendaciones con IA no está disponible en este momento",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/recommendations/compare
   * Compara múltiples palas
   */
  static async compareRackets(req: Request, res: Response): Promise<void> {
    try {
      const { racketIds } = req.body as { racketIds: number[] };

      if (!racketIds || !Array.isArray(racketIds) || racketIds.length < 2) {
        res.status(400).json({
          success: false,
          error: "IDs de palas inválidos",
          message: "Se requieren al menos 2 IDs de palas para comparar",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      if (racketIds.length > 5) {
        res.status(400).json({
          success: false,
          error: "Demasiadas palas",
          message: "Se pueden comparar máximo 5 palas a la vez",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      // Obtener las palas por ID
      const rackets = [];
      for (const id of racketIds) {
        const racket = await RacketService.getRacketById(id);
        if (racket) {
          rackets.push(racket);
        } else {
          res.status(404).json({
            success: false,
            error: "Pala no encontrada",
            message: `No se encontró la pala con ID ${id}`,
            timestamp: new Date().toISOString(),
          } as ApiResponse);
          return;
        }
      }

      console.log(`🔍 Comparando ${rackets.length} palas...`);

      // Generar comparación con IA
      const comparison = await RecommendationService.compareRackets(rackets);

      // Store user interaction if user is authenticated
      const userId = (req as RequestWithUser).user?.id;
      if (userId) {
        try {
          await RecommendationService.storeUserInteraction(
            userId,
            racketIds[0], // Primary racket
            "compare",
            undefined,
            { comparedRackets: racketIds }
          );
        } catch (error) {
          console.warn("Failed to store user interaction:", error);
        }
      }

      res.json({
        success: true,
        data: comparison,
        message: `Comparación generada exitosamente para ${rackets.length} palas`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<RacketComparison>);
    } catch (error: any) {
      console.error("Error in compareRackets:", error);

      // Manejar errores específicos de la IA
      if (
        error.message.includes("API key") ||
        error.message.includes("Gemini")
      ) {
        res.status(503).json({
          success: false,
          error: "Servicio de IA no disponible",
          message:
            "El servicio de comparación con IA no está disponible en este momento",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/recommendations/history
   * Obtiene el historial de recomendaciones del usuario
   */
  static async getRecommendationHistory(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          message: "Se requiere autenticación para acceder al historial",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const history = await RecommendationService.getRecommendationHistory(
        userId
      );

      res.json({
        success: true,
        data: history,
        message: `${history.length} registros en el historial`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in getRecommendationHistory:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/recommendations/interaction
   * Registra una interacción del usuario con una pala
   */
  static async recordInteraction(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          message: "Se requiere autenticación para registrar interacciones",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const { racketId, interactionType, rating, metadata } = req.body as {
        racketId: number;
        interactionType: "view" | "like" | "compare" | "recommend";
        rating?: number;
        metadata?: any;
      };

      if (!racketId || !interactionType) {
        res.status(400).json({
          success: false,
          error: "Datos incompletos",
          message: "Se requieren racketId e interactionType",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      // Verificar que la pala existe
      const racket = await RacketService.getRacketById(racketId);
      if (!racket) {
        res.status(404).json({
          success: false,
          error: "Pala no encontrada",
          message: `No se encontró la pala con ID ${racketId}`,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      await RecommendationService.storeUserInteraction(
        userId,
        racketId,
        interactionType,
        rating,
        metadata
      );

      res.json({
        success: true,
        message: "Interacción registrada exitosamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in recordInteraction:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/recommendations/validate-form
   * Valida los datos del formulario sin generar recomendaciones
   */
  static async validateForm(req: Request, res: Response): Promise<void> {
    try {
      const formData: FormData = req.body as FormData;

      const validation = RecommendationService.validateFormData(formData);

      res.json({
        success: validation.isValid,
        data: {
          isValid: validation.isValid,
          errors: validation.errors,
        },
        message: validation.isValid
          ? "Formulario válido"
          : "Formulario inválido",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in validateForm:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
