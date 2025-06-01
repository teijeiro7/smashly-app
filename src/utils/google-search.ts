// Tipos para la respuesta de Google Custom Search API
export interface GoogleSearchItem {
    title: string;
    link: string;
    displayLink: string;
    snippet: string;
    mime: string;
    fileFormat?: string;
    image?: {
      contextLink: string;
      height: number;
      width: number;
      byteSize: number;
      thumbnailLink: string;
      thumbnailHeight: number;
      thumbnailWidth: number;
    };
  }
  
  export interface GoogleSearchResponse {
    kind: string;
    url: {
      type: string;
      template: string;
    };
    queries: {
      request: Array<{
        title: string;
        totalResults: string;
        searchTerms: string;
        count: number;
        startIndex: number;
        inputEncoding: string;
        outputEncoding: string;
        safe: string;
        cx: string;
        searchType: string;
      }>;
    };
    context: any;
    searchInformation: {
      searchTime: number;
      formattedSearchTime: string;
      totalResults: string;
      formattedTotalResults: string;
    };
    items?: GoogleSearchItem[];
  }
  
  // Función para debuggear las variables de entorno
  function debugEnvironmentVariables() {
    console.log('=== DEBUG ENVIRONMENT VARIABLES ===');
    console.log('EXPO_PUBLIC_GOOGLE_API_KEY exists:', !!process.env.EXPO_PUBLIC_GOOGLE_API_KEY);
    console.log('EXPO_PUBLIC_GOOGLE_CX exists:', !!process.env.EXPO_PUBLIC_GOOGLE_CX);
    console.log('EXPO_PUBLIC_GEMINI_API_KEY exists:', !!process.env.EXPO_PUBLIC_GEMINI_API_KEY);
    
    // Solo mostrar los primeros caracteres por seguridad
    if (process.env.EXPO_PUBLIC_GOOGLE_API_KEY) {
      console.log('Google API Key (first 10 chars):', process.env.EXPO_PUBLIC_GOOGLE_API_KEY.substring(0, 10) + '...');
    }
    if (process.env.EXPO_PUBLIC_GOOGLE_CX) {
      console.log('Google CX:', process.env.EXPO_PUBLIC_GOOGLE_CX);
    }
    
    console.log('All process.env keys:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC')));
    console.log('=== END DEBUG ===');
  }
  
  // Configuración de la API de Google Custom Search con debugging
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const GOOGLE_CX = process.env.EXPO_PUBLIC_GOOGLE_CX;
  
  // Debug inicial
  debugEnvironmentVariables();
  
  // Función principal para buscar imágenes de palas de pádel
  // Función principal para buscar imágenes de palas de pádel
export async function searchRacketImages(
    brand: string,
    model: string,
    options: {
      maxResults?: number;
      imageSize?: 'icon' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'huge';
      imageType?: 'clipart' | 'face' | 'lineart' | 'stock' | 'photo' | 'animated';
      safeSearch?: 'active' | 'moderate' | 'off';
    } = {}
  ): Promise<string[]> {
    try {
      console.log('🔍 Starting image search for:', brand, model);
      
      // Verificar que tenemos las credenciales necesarias
      if (!GOOGLE_API_KEY || !GOOGLE_CX) {
        console.warn('❌ Google Custom Search API credentials not configured');
        console.log('GOOGLE_API_KEY exists:', !!GOOGLE_API_KEY);
        console.log('GOOGLE_CX exists:', !!GOOGLE_CX);
        debugEnvironmentVariables();
        return [];
      }
  
      console.log('✅ Google API credentials found');
  
      const {
        maxResults = 3,
        imageSize = 'medium',
        imageType = 'photo',
        safeSearch = 'active'
      } = options;
  
      // Construir query de búsqueda más específico para palas de pádel
      const searchTerms = `${brand} ${model} pala padel racket`;
  
      // Parámetros de la búsqueda
      const searchParams = new URLSearchParams({
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: searchTerms,
        searchType: 'image',
        num: maxResults.toString(),
        imgSize: imageSize,
        imgType: imageType,
        safe: safeSearch,
        lr: 'lang_es', // Priorizar resultados en español
        cr: 'countryES', // Priorizar resultados de España
        filter: '1', // Filtrar resultados duplicados
      });
  
      // URL de la API de Google Custom Search
      const apiUrl = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;
  
      console.log(`🔎 Searching images for: ${brand} ${model}`);
      console.log(`📍 Query: ${searchTerms}`);
  
      // Realizar la petición con timeout
      const response = await Promise.race([
        fetch(apiUrl),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Search timeout')), 10000)
        )
      ]);
  
      console.log(`📡 API Response status: ${response.status}`);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Google API error: ${response.status} ${response.statusText}`);
        console.error('Error details:', errorText);
        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
      }
  
      const data: GoogleSearchResponse = await response.json();
      console.log(`📊 Search results: ${data.items?.length || 0} items found`);
  
      if (!data.items || data.items.length === 0) {
        console.log(`🔍 No images found for: ${brand} ${model}`);
        return [];
      }
  
      // Procesar y filtrar los resultados
      const imageUrls = data.items
        .filter(item => item.link && item.mime && item.mime.startsWith('image/'))
        .map(item => item.link)
        .slice(0, maxResults);
  
      console.log(`✅ Found ${imageUrls.length} valid images for: ${brand} ${model}`);
      console.log('Image URLs:', imageUrls);
      
      return imageUrls;
  
    } catch (error) {
      console.error('❌ Error searching racket images:', error);
      return [];
    }
  }
  
  // Función para filtrar y validar imágenes
  async function filterAndValidateImages(
    items: GoogleSearchItem[],
    brand: string,
    model: string
  ): Promise<string[]> {
    const validImages: string[] = [];
  
    console.log(`🔍 Filtering ${items.length} images...`);
  
    for (const item of items) {
      try {
        // Verificar que el item tiene una URL de imagen válida
        if (!item.link || !item.mime || !item.mime.startsWith('image/')) {
          console.log(`❌ Invalid image item: ${item.link}`);
          continue;
        }
  
        // Filtrar por relevancia del título y snippet
        const titleLower = item.title.toLowerCase();
        const snippetLower = item.snippet.toLowerCase();
        const brandLower = brand.toLowerCase();
        const modelLower = model.toLowerCase();
  
        const isRelevant = 
          titleLower.includes(brandLower) ||
          titleLower.includes(modelLower) ||
          titleLower.includes('pala') ||
          titleLower.includes('padel') ||
          snippetLower.includes(brandLower) ||
          snippetLower.includes(modelLower) ||
          snippetLower.includes('pala') ||
          snippetLower.includes('padel');
  
        if (!isRelevant) {
          console.log(`⚠️ Not relevant: ${item.title}`);
          continue;
        }
  
        // Validar que la imagen sea accesible (simplificado para evitar timeouts)
        console.log(`✅ Adding valid image: ${item.link.substring(0, 50)}...`);
        validImages.push(item.link);
  
        // Limitar a las primeras 3 imágenes válidas
        if (validImages.length >= 3) {
          break;
        }
  
      } catch (error) {
        console.error('❌ Error validating image:', error);
        continue;
      }
    }
  
    return validImages;
  }
  
  // Función para validar si una URL de imagen es accesible (simplificada)
  async function validateImageUrl(url: string): Promise<boolean> {
    try {
      // Realizar una petición HEAD para verificar que la imagen existe
      const response = await Promise.race([
        fetch(url, { method: 'HEAD' }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Validation timeout')), 3000)
        )
      ]);
  
      // Verificar que la respuesta es exitosa y el content-type es una imagen
      const contentType = response.headers.get('content-type');
      return response.ok && contentType?.startsWith('image/');
  
    } catch (error) {
      console.error(`❌ Invalid image URL: ${url}`, error);
      return false;
    }
  }
  
  // Función para buscar imágenes con términos alternativos si no se encuentran resultados
  export async function searchRacketImagesWithFallback(
    brand: string,
    model: string
  ): Promise<string | null> {
    try {
      console.log(`🔄 Starting fallback search for: ${brand} ${model}`);
      
      // Intentar búsqueda principal
      let images = await searchRacketImages(brand, model, { maxResults: 3 });
      
      if (images.length > 0) {
        console.log(`✅ Found images in main search: ${images[0]}`);
        return images[0]; // Devolver la primera imagen encontrada
      }
  
      // Intentar búsqueda solo con la marca
      console.log(`🔄 Trying brand-only search: ${brand}`);
      images = await searchRacketImages(brand, '', { maxResults: 3 });
      
      if (images.length > 0) {
        console.log(`✅ Found images in brand search: ${images[0]}`);
        return images[0];
      }
  
      // Intentar búsqueda genérica de palas de la marca
      console.log(`🔄 Trying generic search: ${brand} pala padel`);
      images = await searchRacketImages(brand, 'pala padel', { maxResults: 3 });
      
      if (images.length > 0) {
        console.log(`✅ Found images in generic search: ${images[0]}`);
        return images[0];
      }
  
      console.log(`❌ No images found in any search for: ${brand} ${model}`);
      return null;
  
    } catch (error) {
      console.error('❌ Error in fallback search:', error);
      return null;
    }
  }
  
  // Función de testing para verificar la configuración
  export async function testGoogleSearchConfiguration(): Promise<boolean> {
    try {
      console.log('🧪 Testing Google Search Configuration...');
      debugEnvironmentVariables();
      
      if (!GOOGLE_API_KEY || !GOOGLE_CX) {
        console.error('❌ Missing API credentials');
        return false;
      }
  
      // Test con una búsqueda simple
      const testImages = await searchRacketImages('Bullpadel', 'Vertex', { maxResults: 1 });
      
      if (testImages.length > 0) {
        console.log('✅ Google Search API is working correctly!');
        return true;
      } else {
        console.log('⚠️ Google Search API responded but no images found');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Google Search API test failed:', error);
      return false;
    }
  }