import { GoogleGenerativeAI } from '@google/generative-ai';
// ✅ CORRECCIÓN: Comentar hasta crear el archivo
// import { getMultipleRacketImages, testImageService } from './racket-image-service';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

console.log('🔧 Gemini API Configuration:');
console.log('API_KEY exists:', !!API_KEY);
if (API_KEY) {
  console.log('API_KEY preview:', API_KEY.substring(0, 10) + '...');
}

if (!API_KEY) {
  console.error('⚠️ GEMINI API KEY no encontrada. Verifica tu archivo .env');
  console.log('Variables disponibles:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC')));
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

export async function getRacketRecommendations(formData: {
  gameLevel: string;
  playingStyle: string;
  weight: string;
  height: string;
  budget: string;
  shape: string;
}) {
  try {
    console.log('🤖 Starting Gemini recommendations...');
    
    if (!API_KEY || !genAI) {
      throw new Error('API Key de Gemini no configurada correctamente');
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

    console.log('📤 Enviando petición a Gemini para 3 recomendaciones...');
    
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout después de 45 segundos')), 45000)
      )
    ]);

    const response = await (result as any).response;
    const text = response.text();

    console.log('📥 Respuesta recibida de Gemini');

    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const rawRecommendations: MultipleRacketRecommendations = JSON.parse(cleanedText);
      
      if (!rawRecommendations.recommendations || rawRecommendations.recommendations.length !== 3) {
        throw new Error('No se recibieron 3 recomendaciones válidas');
      }

      console.log('✅ Recomendaciones procesadas correctamente');
      
      return {
        success: true,
        recommendations: rawRecommendations
      };
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      return {
        success: false,
        error: 'Error al procesar las recomendaciones. Inténtalo de nuevo.'
      };
    }

  } catch (error: any) {
    console.error('❌ Error detallado al obtener recomendaciones:', error);
    
    if (error.message?.includes('API_KEY')) {
      return {
        success: false,
        error: 'Clave de API no configurada. Verifica tu configuración.'
      };
    } else if (error.message?.includes('fetch')) {
      return {
        success: false,
        error: 'Error de conexión. Verifica tu conexión a internet.'
      };
    } else if (error.message?.includes('Timeout')) {
      return {
        success: false,
        error: 'La petición tardó demasiado. Inténtalo de nuevo.'
      };
    } else {
      return {
        success: false,
        error: 'Error al procesar la solicitud. Inténtalo de nuevo.'
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
      recommendation: result.recommendations.recommendations[0]
    };
  }
  
  return result;
}