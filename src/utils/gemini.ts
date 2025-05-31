import { GoogleGenerativeAI } from '@google/generative-ai';

// En Expo, las variables de entorno deben ser accedidas de esta forma
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Verificación más robusta de la API key
if (!API_KEY) {
  console.error('⚠️ GEMINI API KEY no encontrada. Verifica tu archivo .env');
  console.log('Variables disponibles:', Object.keys(process.env));
}

// Inicializar la instancia de Google Generative AI
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Interface para la respuesta estructurada de la recomendación
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
  alternatives: string[];
  pros: string[];
  cons: string[];
}

// Función para obtener recomendación de pala usando Gemini
export async function getRacketRecommendation(formData: {
  gameLevel: string;
  playingStyle: string;
  weight: string;
  height: string;
  budget: string;
  shape: string;
}) {
  try {
    // Verificar que tenemos API key y genAI está inicializado
    if (!API_KEY || !genAI) {
      throw new Error('API Key de Gemini no configurada correctamente');
    }

    // Obtener el modelo Gemini Pro
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    // Crear el prompt personalizado con los datos del formulario
    const prompt = `
    Eres un experto en pádel con 20 años de experiencia recomendando palas. Analiza el siguiente perfil de jugador y recomienda la mejor pala específica del mercado:

    PERFIL DEL JUGADOR:
    - Nivel de juego: ${formData.gameLevel}
    - Estilo de juego: ${formData.playingStyle}
    - Peso corporal: ${formData.weight} kg
    - Altura: ${formData.height} cm
    - Presupuesto máximo: ${formData.budget}€
    - Forma preferida: ${formData.shape}

    Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto adicional antes o después):

    {
      "racketName": "Marca Modelo completo",
      "brand": "Marca",
      "model": "Modelo",
      "price": "XXX€",
      "imageUrl": "URL de imagen de la pala (busca una real de la marca oficial)",
      "whyThisRacket": "Explicación detallada de por qué esta pala es perfecta para este perfil",
      "technicalSpecs": {
        "weight": "XXXg",
        "balance": "Alto/Medio/Bajo",
        "shape": "Redonda/Lágrima/Diamante",
        "material": "Material principal",
        "level": "Nivel recomendado"
      },
      "alternatives": ["Alternativa 1", "Alternativa 2"],
      "pros": ["Ventaja 1", "Ventaja 2", "Ventaja 3"],
      "cons": ["Desventaja 1", "Desventaja 2"]
    }

    Asegúrate de recomendar palas reales de marcas como Bullpadel, Head, Nox, Adidas, Babolat, Wilson, que estén dentro del presupuesto.
    `;

    console.log('Enviando petición a Gemini...');
    
    // Generar la respuesta con timeout
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout después de 30 segundos')), 30000)
      )
    ]);

    const response = await (result as any).response;
    const text = response.text();

    console.log('Respuesta recibida de Gemini:', text);

    try {
      // Limpiar la respuesta para obtener solo el JSON
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const recommendation: RacketRecommendation = JSON.parse(cleanedText);
      
      return {
        success: true,
        recommendation: recommendation
      };
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return {
        success: false,
        error: 'Error al procesar la recomendación. Inténtalo de nuevo.'
      };
    }

  } catch (error: any) {
    console.error('Error detallado al obtener recomendación:', error);
    
    // Manejo específico de diferentes tipos de errores
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