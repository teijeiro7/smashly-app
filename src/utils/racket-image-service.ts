import { searchRacketImagesWithFallback, testGoogleSearchConfiguration } from './google-search';

// Interface para el resultado de búsqueda de imágenes
export interface RacketImageResult {
  imageUrl: string | null;
  source: 'google' | 'fallback' | 'default';
  searchTerm: string;
}

// Función principal para obtener imagen de una pala
export async function getRacketImage(
  brand: string,
  model: string,
  racketName?: string
): Promise<RacketImageResult> {
  try {
    console.log(`🖼️ Getting image for: ${brand} ${model}`);

    // 1. Intentar búsqueda en Google Custom Search
    const googleImageUrl = await searchRacketImagesWithFallback(brand, model);
    
    if (googleImageUrl) {
      console.log(`✅ Google image found: ${googleImageUrl}`);
      return {
        imageUrl: googleImageUrl,
        source: 'google',
        searchTerm: `${brand} ${model}`
      };
    }

    // 2. Si no se encuentra imagen en Google, usar imagen genérica de pala
    console.log(`🔄 No Google image found, using generic racket image for: ${brand} ${model}`);
    const genericRacketImage = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=600&fit=crop&crop=center'; // Imagen genérica de pala de pádel

    return {
      imageUrl: genericRacketImage,
      source: 'default',
      searchTerm: 'generic racket'
    };

  } catch (error) {
    console.error('❌ Error getting racket image:', error);
    
    // En caso de error, devolver imagen genérica por defecto
    return {
      imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=600&fit=crop&crop=center',
      source: 'default',
      searchTerm: 'error fallback'
    };
  }
}

// Función para obtener imágenes de múltiples palas en paralelo
export async function getMultipleRacketImages(
  rackets: Array<{ brand: string; model: string; racketName?: string }>
): Promise<RacketImageResult[]> {
  try {
    console.log(`🖼️ Getting images for ${rackets.length} rackets...`);

    // Probar la configuración primero
    const isConfigured = await testGoogleSearchConfiguration();
    console.log(`🔧 Google Search configured: ${isConfigured}`);

    // Ejecutar búsquedas en secuencia para evitar rate limiting
    const results: RacketImageResult[] = [];
    
    for (let i = 0; i < rackets.length; i++) {
      const racket = rackets[i];
      console.log(`🔍 Searching image ${i + 1}/${rackets.length}: ${racket.brand} ${racket.model}`);
      
      const result = await getRacketImage(racket.brand, racket.model, racket.racketName);
      results.push(result);
      
      // Delay entre búsquedas para evitar rate limiting
      if (i < rackets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Retrieved ${results.length} images:`, 
      results.map(r => ({ source: r.source, hasImage: !!r.imageUrl }))
    );

    return results;

  } catch (error) {
    console.error('❌ Error getting multiple racket images:', error);
    
    // En caso de error, devolver imágenes por defecto para todas
    return rackets.map(() => ({
      imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=600&fit=crop&crop=center',
      source: 'default' as const,
      searchTerm: 'error fallback'
    }));
  }
}

// Función de testing para verificar que todo funciona
export async function testImageService(): Promise<void> {
  console.log('🧪 Testing Image Service...');
  
  try {
    const testResult = await getRacketImage('Bullpadel', 'Vertex');
    console.log('✅ Image service test result:', testResult);
  } catch (error) {
    console.error('❌ Image service test failed:', error);
  }
}