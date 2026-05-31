const { spawn, execSync } = require('child_process');
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.join(__dirname, '../..');
const RECORDINGS_DIR = path.join(PROJECT_ROOT, 'testing/recordings');
const OUTPUT_VIDEO_DIR = path.join(PROJECT_ROOT, 'public/videos');
const FINAL_MP4_PATH = path.join(OUTPUT_VIDEO_DIR, 'videoDemoFase4.mp4');

let backendProcess = null;
let frontendProcess = null;

// Helper: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Kill any processes running on specific ports
function killPorts() {
  console.log('🧹 Limpiando puertos 3000 y 5173...');
  try {
    execSync('fuser -k 3000/tcp 5173/tcp', { stdio: 'ignore' });
  } catch (e) {
    try {
      execSync('kill $(lsof -t -i:3000 -i:5173) 2>/dev/null', { stdio: 'ignore' });
    } catch (e2) {}
  }
}

// Helper: Wait for a URL to be up and running
async function waitUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  console.log(`⏳ Esperando a que responda la URL: ${url}...`);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 404) {
        console.log(`✅ URL activa: ${url}`);
        return true;
      }
    } catch (e) {
      // Ignore network errors during startup
    }
    await sleep(1000);
  }
  throw new Error(`❌ Tiempo de espera agotado para la URL: ${url}`);
}

// Helper: Smoothly scroll down a page
async function smoothScroll(page, targetY, durationMs = 3000) {
  await page.evaluate(async ({ targetY, durationMs }) => {
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();

    return new Promise((resolve) => {
      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        
        // Easing: easeInOutQuad
        const ease = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        window.scrollTo(0, startY + difference * ease);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
  await page.waitForTimeout(durationMs + 200);
}

// Helper: Smoothly move the mouse cursor to a target and hover
async function smoothHover(page, selector, steps = 15) {
  try {
    const element = page.locator(selector).first();
    const box = await element.boundingBox();
    if (box) {
      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;
      await page.mouse.move(targetX, targetY, { steps });
      await sleep(300);
    }
  } catch (err) {
    console.warn(`Advertencia al hacer hover en ${selector}:`, err.message);
  }
}

// Cleanup function to stop all child processes
function cleanup() {
  console.log('🛑 Deteniendo servidores locales...');
  if (backendProcess) {
    try {
      backendProcess.kill('SIGTERM');
      console.log('Backend detenido.');
    } catch (e) {}
  }
  if (frontendProcess) {
    try {
      frontendProcess.kill('SIGTERM');
      console.log('Frontend detenido.');
    } catch (e) {}
  }
  killPorts();
}

async function main() {
  // Ensure recordings directory exists
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
  if (!fs.existsSync(OUTPUT_VIDEO_DIR)) {
    fs.mkdirSync(OUTPUT_VIDEO_DIR, { recursive: true });
  }

  // Pre-cleanup
  killPorts();

  // Start Backend
  console.log('🚀 Iniciando servidor backend...');
  backendProcess = spawn('npx', ['tsx', 'src/server.ts'], {
    cwd: path.join(PROJECT_ROOT, 'backend/api'),
    env: { ...process.env, PORT: '3000', NODE_ENV: 'development' },
    shell: true,
  });
  
  backendProcess.stderr.on('data', (data) => console.error(`[Backend Error] ${data}`));

  // Start Frontend
  console.log('🚀 Iniciando servidor frontend (Vite)...');
  frontendProcess = spawn('npx', ['vite'], {
    cwd: path.join(PROJECT_ROOT, 'frontend'),
    shell: true,
  });

  frontendProcess.stderr.on('data', (data) => console.error(`[Frontend Error] ${data}`));

  try {
    // Wait for servers to be active
    await waitUrl('http://localhost:3000/api/v1/health');
    await waitUrl('http://localhost:5173');

    // Launch Playwright Browser (Brave)
    console.log('🖥️ Iniciando navegador Brave para grabación de video...');
    const browser = await chromium.launch({
      executablePath: '/usr/bin/brave-browser',
      headless: true,
    });

    const context = await browser.newContext({
      recordVideo: {
        dir: RECORDINGS_DIR,
        size: { width: 1280, height: 720 },
      },
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();
    console.log('🎬 Comenzando grabación del recorrido de la app...');

    // 1. HOME PAGE
    console.log('👉 Visitando Página de Inicio...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await smoothScroll(page, 1200, 3000);
    await page.waitForTimeout(1000);
    await smoothScroll(page, 0, 2000);
    await page.waitForTimeout(1500);

    // 2. REGISTRO Y LOGIN (Simulación real de registro)
    console.log('👉 Abriendo modal de Autenticación para Registro...');
    const loginLink = page.locator('button:has-text("Iniciar sesión"), button:has-text("Acceder"), button:has-text("Entrar")').first();
    if (await loginLink.isVisible()) {
      await smoothHover(page, 'button:has-text("Iniciar sesión"), button:has-text("Acceder")');
      await loginLink.click();
      await page.waitForTimeout(1500);

      // Clic en la pestaña "Registrarse"
      const registerTab = page.locator('button:has-text("Registrarse"), [role="tab"]:has-text("Registrarse")').first();
      if (await registerTab.isVisible()) {
        await registerTab.click();
        await page.waitForTimeout(1000);

        // Completar formulario de registro
        console.log('👉 Completando formulario de Registro...');
        await page.fill('input[placeholder="Tu nombre"]', 'Demo Tester');
        await page.waitForTimeout(300);
        await page.fill('input[placeholder="Tu apodo"]', 'demotester');
        await page.waitForTimeout(300);
        const randomEmail = `demo-${Date.now()}@example.com`;
        await page.fill('input[placeholder="tu@email.com"]', randomEmail);
        await page.waitForTimeout(300);
        await page.fill('input[placeholder="Contraseña"]', 'Password123!');
        await page.waitForTimeout(300);
        await page.fill('input[placeholder="Repetir contraseña"]', 'Password123!');
        await page.waitForTimeout(500);

        // Enviar formulario
        const submitBtn = page.locator('button[type="submit"]:has-text("Crear cuenta"), button:has-text("Crear cuenta")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          console.log('👉 Registro enviado, esperando sesión...');
          await page.waitForTimeout(4000); // Esperar a que el modal se cierre y procese
        }
      }
    }

    // Ir al panel de usuario / dashboard para mostrar el perfil registrado
    console.log('👉 Visitando el Panel del Jugador (Dashboard)...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await smoothScroll(page, 500, 2000);
    await page.waitForTimeout(1500);
    await smoothScroll(page, 0, 1500);
    await page.waitForTimeout(1000);

    // 3. CATALOGO DE PALAS - FORZAR CARGA DE CATÁLOGO COMPLETO
    console.log('👉 Navegando al Catálogo...');
    await page.goto('http://localhost:5173/catalog');
    await page.waitForLoadState('networkidle');
    
    // Esperar a que se carguen las palas (esto puebla local storage y acelera las comparaciones)
    const countLocator = page.locator('[data-testid="rackets-count"]');
    await countLocator.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✅ Catálogo cargado. Info de cantidad:', await countLocator.innerText());
    await page.waitForTimeout(1000);

    await smoothScroll(page, 800, 2500);
    await page.waitForTimeout(1500);
    await smoothScroll(page, 0, 1500);
    await page.waitForTimeout(1000);

    console.log('👉 Interactuando con los filtros...');
    const brandSelect = page.locator('select').first();
    if (await brandSelect.isVisible()) {
      await smoothHover(page, 'select');
      await brandSelect.selectOption({ label: 'Adidas' });
      await page.waitForTimeout(2000);
    }

    // 4. DETALLE DE PALA
    console.log('👉 Abriendo ficha técnica de pala...');
    const racketCard = page.locator('a:has-text("Ver detalle"), button:has-text("Detalle"), a[href*="racket-detail"]').first();
    if (await racketCard.isVisible()) {
      await smoothHover(page, 'a:has-text("Ver detalle"), button:has-text("Detalle"), a[href*="racket-detail"]');
      await racketCard.click();
    } else {
      const firstCard = page.locator('img').first();
      if (await firstCard.isVisible()) {
        await firstCard.click();
      } else {
        await page.goto('http://localhost:5173/racket-detail?id=20028');
      }
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);

    await smoothScroll(page, 1000, 3000);
    await page.waitForTimeout(2000);
    await smoothScroll(page, 2000, 3000);
    await page.waitForTimeout(2000);
    await smoothScroll(page, 0, 2000);
    await page.waitForTimeout(1500);

    // 5. COMPARADOR - EVITAR CONFLICTOS CON EL BUSCADOR GLOBAL DEL HEADER
    console.log('👉 Navegando al Comparador...');
    await page.goto('http://localhost:5173/compare-rackets');
    await page.waitForLoadState('networkidle');
    // Esperar 8 segundos para garantizar que los 1000 elementos están cargados e indexados en el contexto local
    await page.waitForTimeout(8000); 

    // Targetear específicamente el input del comparador mediante su placeholder único
    const searchInput = page.locator('input[placeholder*="añadir"]').first();
    if (await searchInput.isVisible()) {
      console.log('👉 Añadiendo palas para comparar...');
      
      // Primera Pala (Vertex)
      await searchInput.fill('vertex');
      await page.waitForTimeout(2500);
      
      // Esperar explícitamente a que el primer 'li' de la lista de sugerencias sea visible y clicarlo
      const searchResult = page.locator('ul li').first();
      await searchResult.waitFor({ state: 'visible', timeout: 8000 });
      await searchResult.click();
      console.log('✅ Primera pala añadida.');
      await page.waitForTimeout(1500);
      
      // Segunda Pala (Metalbone)
      await searchInput.fill('metalbone');
      await page.waitForTimeout(2500);
      
      const searchResult2 = page.locator('ul li').first();
      await searchResult2.waitFor({ state: 'visible', timeout: 8000 });
      await searchResult2.click();
      console.log('✅ Segunda pala añadida.');
      await page.waitForTimeout(1500);

      // Hacer clic en comparar
      const compareBtn = page.locator('button:has-text("Comparar"), button:has-text("Comparar ahora")').first();
      if (await compareBtn.isVisible()) {
        console.log('👉 Ejecutando comparación...');
        await compareBtn.waitFor({ state: 'visible', timeout: 5000 });
        await smoothHover(page, 'button:has-text("Comparar")');
        await page.waitForTimeout(1000); 
        await compareBtn.click();
        await page.waitForTimeout(5000); // Esperar a que se procese la comparación y se rendericen las gráficas
        
        // Desplazamiento por las gráficas y análisis
        await smoothScroll(page, 1200, 4000);
        await page.waitForTimeout(3000);
        await smoothScroll(page, 0, 2000);
        await page.waitForTimeout(1500);
      }
    }

    // 6. RECOMENDADOR
    console.log('👉 Entrando al Recomendador Inteligente...');
    await page.goto('http://localhost:5173/best-racket');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Si aparece el modal de reutilizar datos, rechazarlo para empezar de cero
    const noReuseBtn = page.locator('button:has-text("No, empezar de cero"), button:has-text("No")').first();
    if (await noReuseBtn.isVisible()) {
      console.log('👉 Rechazando la reutilización de datos anteriores...');
      await noReuseBtn.click();
      await page.waitForTimeout(1000);
    }

    // Asegurar modo básico
    const basicModeBtn = page.locator('button:has-text("Básico")').first();
    if (await basicModeBtn.isVisible()) {
      console.log('👉 Cambiando a modo Básico...');
      await basicModeBtn.click();
      await page.waitForTimeout(1500);
    }

    // 1. Nivel de juego
    console.log('👉 Seleccionando Nivel: Intermedio');
    await page.locator('button:has-text("Intermedio")').first().click();
    await page.waitForTimeout(800);
    await page.locator('button:has-text("Siguiente")').first().click();
    await page.waitForTimeout(1000);

    // 2. Frecuencia
    console.log('👉 Seleccionando Frecuencia: 2-3 veces/semana');
    await page.locator('button:has-text("2-3 veces/semana")').first().click();
    await page.waitForTimeout(800);
    await page.locator('button:has-text("Siguiente")').first().click();
    await page.waitForTimeout(1000);

    // 3. Lesiones
    console.log('👉 Seleccionando Lesiones: No');
    await page.locator('button:has-text("No")').first().click();
    await page.waitForTimeout(800);
    await page.locator('button:has-text("Siguiente")').first().click();
    await page.waitForTimeout(1000);

    // 4. Género
    console.log('👉 Seleccionando Género: Masculino');
    await page.locator('button:has-text("Masculino")').first().click();
    await page.waitForTimeout(800);
    await page.locator('button:has-text("Siguiente")').first().click();
    await page.waitForTimeout(1000);

    // 5. Condición física
    console.log('👉 Seleccionando Condición física: Asiduo al deporte');
    await page.locator('button:has-text("Asiduo al deporte")').first().click();
    await page.waitForTimeout(800);
    await page.locator('button:has-text("Siguiente")').first().click();
    await page.waitForTimeout(1000);

    // 6. Presupuesto (slider, valor por defecto de 50-200€)
    console.log('👉 Presupuesto: Usando valores por defecto');
    await page.locator('button:has-text("Siguiente")').first().click();
    await page.waitForTimeout(1000);

    // 7. Tacto preferido
    console.log('👉 Seleccionando Tacto preferido: Medio');
    await page.locator('button:has-text("Medio")').first().click();
    await page.waitForTimeout(800);
    await page.locator('button:has-text("Siguiente")').first().click();
    await page.waitForTimeout(1000);

    // 8. Pala actual (búsqueda e interactividad)
    console.log('👉 Introduciendo pala actual...');
    const racketSearch = page.locator('input[placeholder*="catálogo"], input[placeholder*="pala"]').first();
    if (await racketSearch.isVisible()) {
      await racketSearch.fill('Metalbone');
      await page.waitForTimeout(1500);
      
      const firstRacketOption = page.locator('div:has-text("Adidas Metalbone"), div:has-text("Metalbone")').first();
      if (await firstRacketOption.isVisible()) {
        await firstRacketOption.click();
        await page.waitForTimeout(1000);
      }
    }

    // Obtener recomendación final (Enviar cuestionario pulsando "Finalizar")
    const finalizeBtn = page.locator('button:has-text("Finalizar")').first();
    if (await finalizeBtn.isVisible()) {
      console.log('👉 Enviando cuestionario, esperando recomendación...');
      await smoothHover(page, 'button:has-text("Finalizar")');
      await finalizeBtn.click();
      await page.waitForTimeout(8000); // Esperar a que la simulación de IA complete y muestre el gráfico de radar
      
      // Mostrar y recorrer el resultado
      await smoothScroll(page, 1000, 3500);
      await page.waitForTimeout(3000);
      await smoothScroll(page, 0, 2000);
      await page.waitForTimeout(1500);
    }

    // 7. FAQs
    console.log('👉 Sección FAQs...');
    await page.goto('http://localhost:5173/faq');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    const faqQuestions = page.locator('h3, button:has-text("?"), [role="button"]');
    const countFaqs = await faqQuestions.count();
    if (countFaqs > 0) {
      await smoothScroll(page, 400, 1500);
      await smoothHover(page, 'h3, [role="button"]');
      await faqQuestions.first().click();
      await page.waitForTimeout(1500);
      if (countFaqs > 1) {
        await faqQuestions.nth(1).click();
        await page.waitForTimeout(1500);
      }
    }

    // Despedida
    console.log('👉 Volviendo a Home...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    console.log('✅ Recorrido finalizado de forma exitosa.');
    await context.close();
    await browser.close();

  } catch (err) {
    console.error('❌ Error durante la grabación de la sesión:', err);
  } finally {
    cleanup();
  }

  // Conversion of Video using FFMPEG
  try {
    console.log('🎬 Procesando el archivo de video generado...');
    const files = fs.readdirSync(RECORDINGS_DIR);
    const webmFile = files.find(f => f.endsWith('.webm'));
    if (!webmFile) {
      throw new Error('No se encontró ningún archivo .webm en el directorio de grabaciones.');
    }
    
    const inputPath = path.join(RECORDINGS_DIR, webmFile);
    console.log(`📹 Convirtiendo ${webmFile} a un MP4 de alta compatibilidad...`);
    
    const ffmpegCommand = `ffmpeg -y -i "${inputPath}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 "${FINAL_MP4_PATH}"`;
    console.log(`Ejecutando: ${ffmpegCommand}`);
    execSync(ffmpegCommand, { stdio: 'inherit' });
    
    console.log(`🎉 ¡Video de demostración guardado con éxito en: ${FINAL_MP4_PATH}!`);
    
    try {
      fs.unlinkSync(inputPath);
      fs.rmdirSync(RECORDINGS_DIR);
      console.log('🗑️ Archivos temporales de grabación eliminados.');
    } catch (e) {}

  } catch (err) {
    console.error('❌ Error al procesar o convertir el video:', err.message);
  }
}

main();
