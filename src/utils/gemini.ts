import { GoogleGenerativeAI } from "@google/generative-ai";
// ✅ CORRECCIÓN: Comentar hasta crear el archivo
// import { getMultipleRacketImages, testImageService } from './racket-image-service';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

console.log("🔧 Gemini API Configuration:");
console.log("API_KEY exists:", !!API_KEY);
if (API_KEY) {
  console.log("API_KEY preview:", API_KEY.substring(0, 10) + "...");
}

if (!API_KEY) {
  console.error("⚠️ GEMINI API KEY no encontrada. Verifica tu archivo .env");
  console.log(
    "Variables disponibles:",
    Object.keys(process.env).filter((key) => key.startsWith("EXPO_PUBLIC"))
  );
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface RacketRecommendation {
  racketName: string;
  brand: string;
  model: string;
  price: string;
  imageUrl: string;
  whyThisRacket: string;
  technicalSpecs: {
    weight: string;
    balance: string;
    shape: string;
    material: string;
    level: string;
  };
  pros: string[];
  cons: string[];
  matchPercentage: number;
}

export interface MultipleRacketRecommendations {
  recommendations: RacketRecommendation[];
  summary: string;
}

// New interfaces for racket comparison
export interface RacketAnalysis {
  name: string;
  keyAttributes: string;
  recommendedFor: string;
  whyThisRacket: string;
  pros: string[];
  cons: string[];
}

export interface RacketComparison {
  generalAnalysis: string;
  racketAnalysis: RacketAnalysis[];
  finalRecommendation: string;
}

// Interface for racket data from JSON
export interface Racket {
  nombre: string;
  marca: string;
  modelo: string;
  precio_actual: number;
  precio_original: number | null;
  descuento_porcentaje: number;
  enlace: string;
  imagen: string;
  es_bestseller: boolean;
  en_oferta: boolean;
  scrapeado_en?: string;
  fuente?: string;
}

export async function getRacketRecommendations(formData: {
  gameLevel: string;
  playingStyle: string;
  weight: string;
  height: string;
  budget: string;
  shape: string;
}) {
  try {
    console.log("🤖 Starting Gemini recommendations...");

    if (!API_KEY || !genAI) {
      throw new Error("API Key de Gemini no configurada correctamente");
    }

    // ✅ CORRECCIÓN: Comentar hasta crear el servicio de imágenes
    // await testImageService();

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 4096,
      },
    });

    const prompt = `
    Eres un experto en pádel con 20 años de experiencia recomendando palas. Analiza el siguiente perfil de jugador y recomienda las 3 mejores palas específicas del mercado, ordenadas por compatibilidad:

    PERFIL DEL JUGADOR:
    - Nivel de juego: ${formData.gameLevel}
    - Estilo de juego: ${formData.playingStyle}
    - Peso corporal: ${formData.weight} kg
    - Altura: ${formData.height} cm
    - Presupuesto máximo: ${formData.budget}€
    - Forma preferida: ${formData.shape}

    Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto adicional antes o después):

    {
      "summary": "Resumen breve de por qué estas 3 palas son las mejores opciones para este perfil",
      "recommendations": [
        {
          "racketName": "Marca Modelo completo",
          "brand": "Marca",
          "model": "Modelo",
          "price": "XXX€",
          "imageUrl": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop&crop=center",
          "whyThisRacket": "Explicación detallada de por qué esta pala es perfecta para este perfil",
          "technicalSpecs": {
            "weight": "XXXg",
            "balance": "Alto/Medio/Bajo",
            "shape": "Redonda/Lágrima/Diamante",
            "material": "Material principal",
            "level": "Nivel recomendado"
          },
          "pros": ["Ventaja 1", "Ventaja 2", "Ventaja 3"],
          "cons": ["Desventaja 1", "Desventaja 2"],
          "matchPercentage": 95
        },
        {
          "racketName": "Marca Modelo completo 2",
          "brand": "Marca",
          "model": "Modelo",
          "price": "XXX€",
          "imageUrl": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop&crop=center",
          "whyThisRacket": "Explicación de por qué esta es una buena segunda opción",
          "technicalSpecs": {
            "weight": "XXXg",
            "balance": "Alto/Medio/Bajo",
            "shape": "Redonda/Lágrima/Diamante",
            "material": "Material principal",
            "level": "Nivel recomendado"
          },
          "pros": ["Ventaja 1", "Ventaja 2", "Ventaja 3"],
          "cons": ["Desventaja 1", "Desventaja 2"],
          "matchPercentage": 85
        },
        {
          "racketName": "Marca Modelo completo 3",
          "brand": "Marca",
          "model": "Modelo",
          "price": "XXX€",
          "imageUrl": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop&crop=center",
          "whyThisRacket": "Explicación de por qué esta es una buena tercera opción",
          "technicalSpecs": {
            "weight": "XXXg",
            "balance": "Alto/Medio/Bajo",
            "shape": "Redonda/Lágrima/Diamante",
            "material": "Material principal",
            "level": "Nivel recomendado"
          },
          "pros": ["Ventaja 1", "Ventaja 2", "Ventaja 3"],
          "cons": ["Desventaja 1", "Desventaja 2"],
          "matchPercentage": 75
        }
      ]
    }

    IMPORTANTE:
    - La primera recomendación DEBE ser la que mejor se adapte al perfil (matchPercentage más alto)
    - Asegúrate de recomendar palas reales de marcas como Bullpadel, Head, Nox, Adidas, Babolat, Wilson
    - Todas las palas deben estar dentro del presupuesto indicado
    - Ordena por compatibilidad: la primera es la más recomendada, la segunda una buena alternativa, la tercera otra opción válida
    - Varía los tipos de palas para dar opciones diversas pero todas apropiadas para el perfil
    - USA NOMBRES DE MARCA Y MODELO EXACTOS que existan realmente en el mercado
    `;

    console.log("📤 Enviando petición a Gemini para 3 recomendaciones...");

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout después de 45 segundos")),
          45000
        )
      ),
    ]);

    const response = await (result as any).response;
    const text = response.text();

    console.log("📥 Respuesta recibida de Gemini");

    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const rawRecommendations: MultipleRacketRecommendations =
        JSON.parse(cleanedText);

      if (
        !rawRecommendations.recommendations ||
        rawRecommendations.recommendations.length !== 3
      ) {
        throw new Error("No se recibieron 3 recomendaciones válidas");
      }

      console.log("✅ Recomendaciones procesadas correctamente");

      return {
        success: true,
        recommendations: rawRecommendations,
      };
    } catch (parseError) {
      console.error("❌ Error parsing JSON:", parseError);
      return {
        success: false,
        error: "Error al procesar las recomendaciones. Inténtalo de nuevo.",
      };
    }
  } catch (error: any) {
    console.error("❌ Error detallado al obtener recomendaciones:", error);

    if (error.message?.includes("API_KEY")) {
      return {
        success: false,
        error: "Clave de API no configurada. Verifica tu configuración.",
      };
    } else if (error.message?.includes("fetch")) {
      return {
        success: false,
        error: "Error de conexión. Verifica tu conexión a internet.",
      };
    } else if (error.message?.includes("Timeout")) {
      return {
        success: false,
        error: "La petición tardó demasiado. Inténtalo de nuevo.",
      };
    } else {
      return {
        success: false,
        error: "Error al procesar la solicitud. Inténtalo de nuevo.",
      };
    }
  }
}

// ✅ Función mantenida para compatibilidad
export async function getRacketRecommendation(formData: {
  gameLevel: string;
  playingStyle: string;
  weight: string;
  height: string;
  budget: string;
  shape: string;
}) {
  const result = await getRacketRecommendations(formData);

  if (result.success && result.recommendations) {
    return {
      success: true,
      recommendation: result.recommendations.recommendations[0],
    };
  }

  return result;
}

// New function to compare rackets using Gemini AI
export async function compareRackets(
  rackets: Racket[]
): Promise<RacketComparison> {
  if (!genAI) {
    throw new Error("Gemini AI no está configurado. Verifica tu API key.");
  }

  if (rackets.length < 2 || rackets.length > 3) {
    throw new Error("Debes proporcionar entre 2 y 3 palas para comparar.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare racket data for analysis
    const racketData = rackets.map((racket, index) => ({
      id: index + 1,
      nombre: racket.nombre,
      marca: racket.marca,
      modelo: racket.modelo,
      precio: racket.precio_actual,
      precioOriginal: racket.precio_original,
      descuento: racket.descuento_porcentaje,
      esOferta: racket.en_oferta,
      esBestseller: racket.es_bestseller,
    }));

    const prompt = `
Eres un experto en palas de pádel con más de 20 años de experiencia ayudando a jugadores de todos los niveles. 

Analiza estas ${
      rackets.length
    } palas de pádel y proporciona una comparación detallada:

${racketData
  .map(
    (racket) => `
PALA ${racket.id}: ${racket.nombre}
- Marca: ${racket.marca}
- Modelo: ${racket.modelo}
- Precio actual: €${racket.precio}
${racket.precioOriginal ? `- Precio original: €${racket.precioOriginal}` : ""}
${
  racket.esOferta
    ? `- En oferta: Sí (${racket.descuento}% descuento)`
    : "- En oferta: No"
}
${racket.esBestseller ? "- Bestseller: Sí" : "- Bestseller: No"}
`
  )
  .join("\n")}

INSTRUCCIONES:
1. Proporciona un análisis general comparativo de todas las palas en 150-200 palabras
2. Para cada pala, analiza:
   - Atributos clave (forma, peso estimado, balance, nivel recomendado)
   - A qué tipo de jugador está dirigida (principiante, intermedio, avanzado, estilo de juego)
   - Por qué alguien elegiría esta pala específica
   - 3-4 pros principales
   - 2-3 contras principales
3. Proporciona una recomendación final sobre cuál elegir según diferentes perfiles de jugador

FORMATO DE RESPUESTA (JSON):
{
  "generalAnalysis": "Análisis comparativo general de las palas...",
  "racketAnalysis": [
    {
      "name": "Nombre de la pala 1",
      "keyAttributes": "Forma redonda/lágrima/diamante, peso X gramos, balance bajo/medio/alto, nivel principiante/intermedio/avanzado",
      "recommendedFor": "Tipo de jugador específico (nivel y estilo)",
      "whyThisRacket": "Razones específicas para elegir esta pala",
      "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4"],
      "cons": ["Contra 1", "Contra 2", "Contra 3"]
    }
  ],
  "finalRecommendation": "Recomendación final detallada según diferentes perfiles de jugador..."
}

IMPORTANTE: 
- Sé específico y técnico pero accesible
- Considera el precio en la recomendación 
- Menciona si las ofertas hacen que alguna pala sea especialmente atractiva
- Responde SOLO con el JSON válido, sin texto adicional
`;

    console.log("🔍 Enviando prompt de comparación a Gemini...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Respuesta de Gemini recibida");

    // Parse the JSON response
    let comparisonData: RacketComparison;
    try {
      // Clean the response text
      const cleanText = text
        .replace(/```json\n?/, "")
        .replace(/```\n?$/, "")
        .trim();
      comparisonData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("❌ Error parsing Gemini response:", parseError);
      console.log("Raw response:", text);
      throw new Error(
        "Error al procesar la respuesta de la IA. Inténtalo de nuevo."
      );
    }

    // Validate the response structure
    if (
      !comparisonData.generalAnalysis ||
      !comparisonData.racketAnalysis ||
      !comparisonData.finalRecommendation
    ) {
      throw new Error("La respuesta de la IA no tiene el formato esperado.");
    }

    if (comparisonData.racketAnalysis.length !== rackets.length) {
      throw new Error("La IA no analizó todas las palas correctamente.");
    }

    console.log("✅ Comparación de palas generada exitosamente");
    return comparisonData;
  } catch (error: any) {
    console.error("❌ Error en compareRackets:", error);

    if (error.message?.includes("API key")) {
      throw new Error("Error de configuración: API key de Gemini no válida.");
    } else if (error.message?.includes("quota")) {
      throw new Error("Cuota de API excedida. Inténtalo más tarde.");
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("fetch")
    ) {
      throw new Error("Error de conexión. Verifica tu conexión a internet.");
    } else if (error.message?.includes("timeout")) {
      throw new Error("La petición tardó demasiado. Inténtalo de nuevo.");
    } else {
      throw new Error(
        error.message || "Error al comparar las palas. Inténtalo de nuevo."
      );
    }
  }
}
