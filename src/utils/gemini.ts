import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  FormData,
  MultipleRacketRecommendations,
  Racket,
  RacketComparison,
  RacketRecommendation,
} from "../types/racket";

// Safe access to Vite environment variables
const getEnvVar = (key: string): string | undefined => {
  try {
    // In Vite, environment variables are available on import.meta.env
    const env = (import.meta as any).env;
    return env?.[key];
  } catch (error) {
    console.warn(`Error accessing environment variable ${key}:`, error);
    return undefined;
  }
};

const API_KEY = getEnvVar("VITE_GEMINI_API_KEY");

console.log("🔧 Gemini AI Configuration:");
console.log("API_KEY exists:", !!API_KEY);
console.log("Environment:", getEnvVar("MODE") || "unknown");
if (API_KEY) {
  console.log("API_KEY preview:", API_KEY.substring(0, 10) + "...");
}

if (!API_KEY) {
  console.error(
    "⚠️ VITE_GEMINI_API_KEY no encontrada. Verifica tu archivo .env"
  );
  console.log("💡 La variable debe llamarse: VITE_GEMINI_API_KEY");
  try {
    const env = (import.meta as any).env;
    if (env) {
      const availableVars = Object.keys(env).filter(
        (key) => key.startsWith("VITE_") || key.startsWith("EXPO_")
      );
      console.log("Variables disponibles:", availableVars);
    }
  } catch {
    console.log("No se pudieron leer las variables de entorno");
  }
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Available models to try in order of preference
const AVAILABLE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro",
];

// Function to get a working model
async function getWorkingModel() {
  if (!genAI) {
    throw new Error("Gemini AI no está configurado. Verifica tu API key.");
  }

  for (const modelName of AVAILABLE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // Test the model with a simple request
      console.log(`� Testing model: ${modelName}`);
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

// Function to test API connectivity
export async function testGeminiConnection(): Promise<boolean> {
  if (!genAI) {
    console.error("❌ Gemini AI no está configurado");
    return false;
  }

  try {
    const { model, modelName } = await getWorkingModel();
    console.log(`✅ Conectado a Gemini usando modelo: ${modelName}`);

    // Test with a simple prompt
    const result = await model.generateContent("Test connection");
    const response = await result.response;
    console.log("🧪 Test de conexión exitoso");
    return true;
  } catch (error) {
    console.error("❌ Error de conexión con Gemini:", error);
    return false;
  }
}

// Main function to get racket recommendations based on user profile
export async function getRacketRecommendations(
  formData: FormData,
  racketDatabase: Racket[]
): Promise<MultipleRacketRecommendations> {
  if (!genAI) {
    throw new Error("Gemini AI no está configurado. Verifica tu API key.");
  }

  try {
    const { model, modelName } = await getWorkingModel();
    console.log(`✅ Using model: ${modelName}`);

    // Filter rackets by budget if specified
    let filteredRackets = racketDatabase;
    if (formData.budget && !isNaN(parseFloat(formData.budget))) {
      const budgetLimit = parseFloat(formData.budget);
      filteredRackets = racketDatabase.filter(
        (racket) => racket.precio_actual <= budgetLimit
      );
    }

    const racketsList = filteredRackets
      .slice(0, 50) // Limit to first 50 rackets for prompt efficiency
      .map(
        (racket) =>
          `${racket.nombre} - ${racket.marca} ${racket.modelo} - €${
            racket.precio_actual
          }${racket.en_oferta ? " (En oferta)" : ""}${
            racket.es_bestseller ? " (Bestseller)" : ""
          }`
      )
      .join("\n");

    const prompt = `
Eres un experto en pádel especializado en recomendaciones de palas. Basándote en el perfil del usuario y esta base de datos de palas, proporciona exactamente 3 recomendaciones personalizadas.

PERFIL DEL USUARIO:
- Nivel de juego: ${formData.gameLevel}
- Estilo de juego: ${formData.playingStyle}
- Peso corporal: ${formData.weight} kg
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
  "summary": "Resumen general de las recomendaciones y por qué estas 3 palas son las mejores opciones para este usuario (100-150 palabras)"
}

IMPORTANTE: 
- Usa SOLO palas que existan en la base de datos proporcionada
- Los nombres deben coincidir exactamente
- Proporciona información técnica realista para cada tipo de pala
- El porcentaje de match debe reflejar qué tan bien se adapta cada pala al usuario (85-98%)
- No incluyas texto adicional fuera del JSON
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 Respuesta cruda de Gemini:", text);

    // Clean the response to ensure it's valid JSON
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/\n?```/g, "")
      .trim();

    try {
      const recommendations: MultipleRacketRecommendations =
        JSON.parse(cleanedText);

      // Validate that we have 3 recommendations
      if (
        !recommendations.recommendations ||
        recommendations.recommendations.length !== 3
      ) {
        throw new Error("El AI no proporcionó exactamente 3 recomendaciones");
      }

      // Enhance with actual racket data
      const enhancedRecommendations = recommendations.recommendations.map(
        (rec) => {
          const actualRacket = filteredRackets.find(
            (r) =>
              r.nombre.toLowerCase().includes(rec.racketName.toLowerCase()) ||
              rec.racketName.toLowerCase().includes(r.nombre.toLowerCase())
          );

          if (actualRacket) {
            return {
              ...rec,
              imageUrl: actualRacket.imagen,
              price: `€${actualRacket.precio_actual}`,
            };
          }
          return rec;
        }
      );

      return {
        ...recommendations,
        recommendations: enhancedRecommendations,
      };
    } catch (parseError) {
      console.error("❌ Error parsing JSON:", parseError);
      console.error("Texto recibido:", cleanedText);
      throw new Error(
        "Error al procesar la respuesta del AI. Inténtalo de nuevo."
      );
    }
  } catch (error) {
    console.error("❌ Error en getRacketRecommendations:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (
        error.message.includes("404") ||
        error.message.includes("not found")
      ) {
        throw new Error(
          "Modelo de IA no disponible. Reintentando con un modelo diferente..."
        );
      } else if (error.message.includes("API key")) {
        throw new Error(
          "API key de Gemini inválida. Verifica tu configuración."
        );
      } else if (
        error.message.includes("quota") ||
        error.message.includes("rate limit")
      ) {
        throw new Error(
          "Límite de uso de la API alcanzado. Intenta de nuevo más tarde."
        );
      }
      throw new Error(`Error del AI: ${error.message}`);
    }

    throw new Error("Error desconocido del AI");
  }
}

// Function to compare rackets using AI
export async function compareRackets(
  selectedRackets: Racket[]
): Promise<RacketComparison> {
  if (!genAI) {
    throw new Error("Gemini AI no está configurado. Verifica tu API key.");
  }

  if (selectedRackets.length < 2 || selectedRackets.length > 3) {
    throw new Error("Debes seleccionar entre 2 y 3 palas para comparar");
  }

  try {
    const { model, modelName } = await getWorkingModel();
    console.log(`✅ Using model for comparison: ${modelName}`);

    const racketsInfo = selectedRackets
      .map(
        (racket, index) =>
          `PALA ${index + 1}: ${racket.nombre}
- Marca: ${racket.marca}
- Modelo: ${racket.modelo}
- Precio: €${racket.precio_actual}
- En oferta: ${racket.en_oferta ? "Sí" : "No"}
- Bestseller: ${racket.es_bestseller ? "Sí" : "No"}
- Descuento: ${racket.en_oferta ? `${racket.descuento_porcentaje}%` : "No"}`
      )
      .join("\n\n");

    const prompt = `
Eres un experto en pádel con más de 20 años de experiencia. Analiza estas ${selectedRackets.length} palas de pádel y proporciona una comparación profesional:

${racketsInfo}

Proporciona un análisis completo que incluya:
1. Análisis general comparativo
2. Análisis individual de cada pala
3. Recomendación final

Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "generalAnalysis": "Análisis general comparativo de todas las palas (200-250 palabras). Explica las diferencias principales, relación calidad-precio y a qué tipo de jugadores se dirige cada una.",
  "racketAnalysis": [
    {
      "name": "Nombre exacto de la pala",
      "keyAttributes": "Forma, peso estimado, balance, nivel recomendado y características principales",
      "recommendedFor": "Tipo específico de jugador (nivel y estilo de juego)",
      "whyThisRacket": "Razones específicas para elegir esta pala sobre las otras",
      "pros": ["Ventaja específica 1", "Ventaja específica 2", "Ventaja específica 3", "Ventaja específica 4"],
      "cons": ["Consideración o limitación 1", "Consideración o limitación 2", "Consideración o limitación 3"]
    }
  ],
  "finalRecommendation": "Recomendación final detallada sobre cuál elegir según diferentes perfiles de jugador y por qué. Incluye aspectos como relación calidad-precio, ofertas actuales si las hay, y casos específicos de uso (200-250 palabras)."
}

IMPORTANTE: 
- Usa los nombres exactos de las palas proporcionadas
- Sé específico sobre las características técnicas de cada pala
- Considera el precio y las ofertas en tu análisis
- Proporciona consejos prácticos y realistas
- No incluyas texto adicional fuera del JSON
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 Respuesta de comparación de Gemini:", text);

    // Clean the response to ensure it's valid JSON
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/\n?```/g, "")
      .trim();

    try {
      const comparison: RacketComparison = JSON.parse(cleanedText);

      // Validate the response structure
      if (
        !comparison.generalAnalysis ||
        !comparison.racketAnalysis ||
        !comparison.finalRecommendation
      ) {
        throw new Error("Respuesta del AI incompleta");
      }

      if (comparison.racketAnalysis.length !== selectedRackets.length) {
        throw new Error("El AI no analizó todas las palas seleccionadas");
      }

      return comparison;
    } catch (parseError) {
      console.error("❌ Error parsing comparison JSON:", parseError);
      console.error("Texto recibido:", cleanedText);
      throw new Error(
        "Error al procesar la comparación del AI. Inténtalo de nuevo."
      );
    }
  } catch (error) {
    console.error("❌ Error en compareRackets:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("404") ||
        error.message.includes("not found")
      ) {
        throw new Error(
          "Modelo de IA no disponible para comparación. Reintentando..."
        );
      } else if (error.message.includes("API key")) {
        throw new Error(
          "API key de Gemini inválida. Verifica tu configuración."
        );
      }
      throw new Error(`Error del AI: ${error.message}`);
    }

    throw new Error("Error desconocido del AI");
  }
}

// Function to get AI analysis for a single racket
export async function getSimpleRacketRecommendation(
  userProfile: FormData
): Promise<RacketRecommendation> {
  if (!genAI) {
    throw new Error("Gemini AI no está configurado. Verifica tu API key.");
  }

  try {
    const { model, modelName } = await getWorkingModel();
    console.log(`✅ Using model for simple recommendation: ${modelName}`);

    const prompt = `
Basándote en este perfil de jugador de pádel, recomienda el tipo de pala ideal:

PERFIL DEL USUARIO:
- Nivel: ${userProfile.gameLevel}
- Estilo: ${userProfile.playingStyle}
- Peso: ${userProfile.weight} kg
- Altura: ${userProfile.height} cm
- Presupuesto: €${userProfile.budget}
- Forma preferida: ${userProfile.preferredShape || "Sin preferencia"}

Proporciona una recomendación general sobre qué tipo de pala buscar.

Responde con un JSON en este formato:
{
  "racketName": "Tipo de pala recomendada",
  "brand": "Recomendación de marca",
  "model": "Características del modelo",
  "price": "Rango de precio",
  "imageUrl": "",
  "whyThisRacket": "Explicación detallada",
  "technicalSpecs": {
    "weight": "Peso recomendado",
    "balance": "Balance recomendado",
    "shape": "Forma recomendada",
    "material": "Material recomendado",
    "level": "Nivel apropiado"
  },
  "pros": ["Ventaja 1", "Ventaja 2", "Ventaja 3"],
  "cons": ["Consideración 1", "Consideración 2"],
  "matchPercentage": 90
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/\n?```/g, "")
      .trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("❌ Error en getSimpleRacketRecommendation:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("404") ||
        error.message.includes("not found")
      ) {
        throw new Error(
          "Modelo de IA no disponible. Verifica la configuración."
        );
      }
      throw new Error(`Error del AI: ${error.message}`);
    }

    throw new Error("Error al obtener recomendación del AI");
  }
}

export {
  type MultipleRacketRecommendations,
  type Racket,
  type RacketComparison,
  type RacketRecommendation,
};
