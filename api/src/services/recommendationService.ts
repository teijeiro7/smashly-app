import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  FormData,
  MultipleRacketRecommendations,
  Racket,
  RacketComparison,
  RacketRecommendation,
} from "../types";

export class RecommendationService {
  private static genAI: GoogleGenerativeAI | null = null;

  static initialize(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    console.log("✅ Recommendation service initialized with Gemini AI");
  }

  // Available models to try in order of preference
  private static readonly AVAILABLE_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-pro",
  ];

  /**
   * Get a working Gemini model
   */
  private static async getWorkingModel() {
    if (!this.genAI) {
      throw new Error("Gemini AI no está configurado. Verifica tu API key.");
    }

    for (const modelName of this.AVAILABLE_MODELS) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        console.log(`🔍 Testing model: ${modelName}`);
        return { model, modelName };
      } catch (error) {
        console.warn(`⚠️ Model ${modelName} failed:`, error);
        continue;
      }
    }

    throw new Error(
      "Ningún modelo de Gemini está disponible. Verifica tu configuración."
    );
  }

  /**
   * Get racket recommendations based on user profile
   */
  static async getRacketRecommendations(
    formData: FormData,
    racketDatabase: Racket[]
  ): Promise<MultipleRacketRecommendations> {
    if (!this.genAI) {
      throw new Error("Gemini AI no está configurado. Verifica tu API key.");
    }

    try {
      const { model, modelName } = await this.getWorkingModel();
      console.log(`✅ Using model: ${modelName}`);

      // Filter rackets by budget if specified
      let filteredRackets = racketDatabase;
      if (formData.budget && !isNaN(parseFloat(formData.budget))) {
        const budgetLimit = parseFloat(formData.budget);
        filteredRackets = racketDatabase.filter(
          (racket) =>
            racket.precio_actual && racket.precio_actual <= budgetLimit
        );
      }

      // Limit to 100 rackets for better performance
      const limitedRackets = filteredRackets.slice(0, 100);

      // Prepare racket data for analysis
      const racketsList = limitedRackets
        .map((racket) => {
          return `Nombre: ${racket.nombre}
Marca: ${racket.marca || "No especificada"}
Precio: €${racket.precio_actual || "No disponible"}
Forma: ${racket.caracteristicas_forma || "No especificada"}
Balance: ${racket.caracteristicas_balance || "No especificado"}
Nivel: ${racket.caracteristicas_nivel_de_juego || "No especificado"}
Núcleo: ${racket.caracteristicas_nucleo || "No especificado"}
Material cara: ${racket.caracteristicas_cara || "No especificado"}`;
        })
        .join("\n\n---\n\n");

      const prompt = `
Eres un experto en pádel que debe recomendar exactamente 3 palas de la base de datos proporcionada.

PERFIL DEL USUARIO:
- Nivel de juego: ${formData.gameLevel}
- Estilo de juego: ${formData.playingStyle}
- Peso: ${formData.weight} kg
- Altura: ${formData.height} cm
- Presupuesto máximo: €${formData.budget}
- Forma preferida: ${formData.preferredShape || "Sin preferencia"}

BASE DE DATOS DE PALAS DISPONIBLES:
${racketsList}

INSTRUCCIONES:
1. Selecciona exactamente 3 palas de la base de datos que mejor se adapten al perfil
2. Ordénalas por relevancia (la mejor primera)
3. Para cada pala, proporciona análisis detallado

Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "recommendations": [
    {
      "racketName": "Nombre exacto de la pala de la base de datos",
      "brand": "Marca",
      "model": "Modelo",
      "price": "€XXX",
      "imageUrl": "URL_de_imagen_si_disponible",
      "whyThisRacket": "Explicación detallada de por qué esta pala es perfecta para este usuario (150-200 palabras)",
      "technicalSpecs": {
        "weight": "XXX-XXX gramos",
        "balance": "Medio/Alto/Bajo",
        "shape": "Redonda/Lágrima/Diamante",
        "material": "Fibra de vidrio/Carbono/etc",
        "level": "Principiante/Intermedio/Avanzado"
      },
      "pros": ["Ventaja 1", "Ventaja 2", "Ventaja 3"],
      "cons": ["Consideración 1", "Consideración 2"],
      "matchPercentage": 95
    }
  ],
  "summary": "Resumen general de las recomendaciones y por qué son ideales para este perfil (100-150 palabras)"
}`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log(`📊 Gemini Response Length: ${text.length} characters`);

      try {
        // Clean the response text
        const cleanedText = text
          .replace(/```json\s*/, "")
          .replace(/```\s*$/, "")
          .replace(/^\s*```/, "")
          .replace(/```\s*$/, "")
          .trim();

        const recommendations: MultipleRacketRecommendations =
          JSON.parse(cleanedText);

        // Validate the response
        if (
          !recommendations.recommendations ||
          !Array.isArray(recommendations.recommendations)
        ) {
          throw new Error(
            "Invalid response format: missing recommendations array"
          );
        }

        if (recommendations.recommendations.length === 0) {
          throw new Error("No recommendations received from AI");
        }

        console.log(
          `✅ Successfully parsed ${recommendations.recommendations.length} recommendations`
        );
        return recommendations;
      } catch (parseError) {
        console.error("❌ Error parsing Gemini response:", parseError);
        console.log("Raw response:", text);
        throw new Error(
          `Error procesando la respuesta de la IA: ${parseError}`
        );
      }
    } catch (error: any) {
      console.error("❌ Error in getRacketRecommendations:", error);
      throw new Error(`Error generando recomendaciones: ${error.message}`);
    }
  }

  /**
   * Compare multiple rackets
   */
  static async compareRackets(rackets: Racket[]): Promise<RacketComparison> {
    if (!this.genAI) {
      throw new Error("Gemini AI no está configurado. Verifica tu API key.");
    }

    if (rackets.length < 2) {
      throw new Error("Se necesitan al menos 2 palas para comparar");
    }

    try {
      const { model, modelName } = await this.getWorkingModel();
      console.log(`✅ Using model for comparison: ${modelName}`);

      const racketsData = rackets
        .map((racket) => {
          return `Nombre: ${racket.nombre}
Marca: ${racket.marca || "No especificada"}
Precio: €${racket.precio_actual || "No disponible"}
Forma: ${racket.caracteristicas_forma || "No especificada"}
Balance: ${racket.caracteristicas_balance || "No especificado"}
Nivel: ${racket.caracteristicas_nivel_de_juego || "No especificado"}
Núcleo: ${racket.caracteristicas_nucleo || "No especificado"}
Material cara: ${racket.caracteristicas_cara || "No especificado"}`;
        })
        .join("\n\n---\n\n");

      const prompt = `
Eres un experto en pádel. Compara las siguientes palas y proporciona un análisis detallado:

PALAS A COMPARAR:
${racketsData}

Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "generalAnalysis": "Análisis general comparativo de todas las palas (200-300 palabras)",
  "racketAnalysis": [
    {
      "name": "Nombre de la pala",
      "keyAttributes": "Características principales",
      "recommendedFor": "Tipo de jugador recomendado",
      "whyThisRacket": "Por qué elegir esta pala",
      "pros": ["Ventaja 1", "Ventaja 2", "Ventaja 3"],
      "cons": ["Desventaja 1", "Desventaja 2"],
      "verdict": "Veredicto final sobre esta pala"
    }
  ],
  "finalRecommendation": {
    "bestOverall": "Nombre de la mejor pala en general",
    "bestValue": "Nombre de la pala con mejor relación calidad-precio",
    "bestForBeginners": "Nombre de la mejor para principiantes (si aplica)",
    "bestForAdvanced": "Nombre de la mejor para avanzados (si aplica)",
    "reasoning": "Razonamiento de las recomendaciones finales"
  }
}`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      try {
        const cleanedText = text
          .replace(/```json\s*/, "")
          .replace(/```\s*$/, "")
          .replace(/^\s*```/, "")
          .replace(/```\s*$/, "")
          .trim();

        const comparison: RacketComparison = JSON.parse(cleanedText);
        console.log("✅ Successfully parsed racket comparison");
        return comparison;
      } catch (parseError) {
        console.error("❌ Error parsing comparison response:", parseError);
        console.log("Raw response:", text);
        throw new Error(`Error procesando la comparación: ${parseError}`);
      }
    } catch (error: any) {
      console.error("❌ Error in compareRackets:", error);
      throw new Error(`Error comparando palas: ${error.message}`);
    }
  }

  /**
   * Store user interaction for learning purposes
   */
  static async storeUserInteraction(
    userId: string,
    racketId: number,
    interactionType: "view" | "like" | "compare" | "recommend",
    rating?: number,
    metadata?: any
  ): Promise<void> {
    // This would typically store in a database for learning
    // For now, just log the interaction
    console.log("📊 User interaction stored:", {
      userId,
      racketId,
      interactionType,
      rating,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get recommendation history for a user
   */
  static async getRecommendationHistory(userId: string): Promise<any[]> {
    // This would fetch from a database
    // For now, return empty array
    console.log("📚 Fetching recommendation history for user:", userId);
    return [];
  }

  /**
   * Validate form data
   */
  static validateFormData(formData: FormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!formData.gameLevel) {
      errors.push("Nivel de juego es requerido");
    }

    if (!formData.playingStyle) {
      errors.push("Estilo de juego es requerido");
    }

    if (!formData.weight || isNaN(parseFloat(formData.weight))) {
      errors.push("Peso válido es requerido");
    }

    if (!formData.height || isNaN(parseFloat(formData.height))) {
      errors.push("Altura válida es requerida");
    }

    if (!formData.budget || isNaN(parseFloat(formData.budget))) {
      errors.push("Presupuesto válido es requerido");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
