# Dossier de marca Smashly para producción de vídeo

Extraído del propio código y docs del repo. Todos los valores son literales.

---

## 1. Qué es y para quién

> "Smashly es una aplicación web diseñada para jugadores de pádel amateur y semi-profesionales que quieren encontrar la pala perfecta para su estilo de juego." — README.md

- **Título SEO**: "Smashly — Comparador de Palas de Pádel con IA | +800 Modelos"
- **Tagline oficial** (`frontend/src/config/seo.ts`): "Encuentra tu Pala de Pádel Perfecta"
- **Eslogan del banner**: "Your game, your racket" (en inglés — inconsistente con el producto, que es todo en español)
- **Web**: https://smashly-app.es · **Locale**: es_ES · **Mercado**: España

**Propuesta de valor (4 pilares)**
1. Catálogo de +800 palas con ficha técnica completa (peso, balance, forma, núcleo, cara, dureza, nivel, tipo)
2. Comparación de precios en tiempo real entre PadelNuestro, PadelMarket y PadelProShop
3. Recomendador con IA según perfil físico, nivel y estilo de juego
4. Gratis y sin registro obligatorio

**Público**: jugador de pádel amateur o semi-pro español, indeciso ante la compra, sin conocimiento
técnico profundo. Segmentos secundarios: tiendas (`store`) y clubes/academias.

---

## 2. Identidad visual

### Verde de marca (fijo en modo claro y oscuro)

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | **#16a34a** | Verde Smashly. `theme-color` del PWA |
| `--primary-hover` / `--header-bg` | **#15803d** | Hover, cabecera |
| `--primary-light` | **#22c55e** | Verde claro, checks del hero |
| `--brand-surface-strong` | **#0f6e38** | Gradiente hero |
| `--brand-surface-deep` / `--footer-bg` | **#0f2818** | Verde bosque muy oscuro |

### Acentos
- **#d97706** — ámbar tostado. Es el color de la frase rotatoria del hero. **El acento principal en vídeo.**
- **#f59e0b** — ámbar secundario / warning
- **#3b82f6** — azul info · **#10b981** éxito · **#ef4444** error · **#8b5cf6** violeta (badges de IA)

### Superficies
- Claro: fondo **#f3f7f1** (blanco con tinte verde), superficies #ffffff / #f9fafb / #f3f4f6, texto #1f2937, muted #6b7280, bordes #e5e7eb
- Oscuro (forest-tinted, no negro puro): fondo **#0a0f0d**, superficies #121a16 / #1a2420 / #243029, texto #e8efe9, footer #051008, header #0a3818

### Gradiente del hero (literal)
```css
linear-gradient(145deg, #0f2818 0%, #0f6e38 30%, #16a34a 60%, #15803d 100%)
```
Sobre él, texto blanco. Overlay de grano fractal al 3% de opacidad en toda la app.

### Tipografía
- **Satoshi** (Indian Type Foundry, vía Fontshare). Pesos **400, 500, 700, 900** — **no hay 600**.
- Alternativas visualmente próximas si Satoshi no está disponible: General Sans, Inter Tight.
- H1 hero: `clamp(2rem, 7vw, 5rem)`, peso 800, letter-spacing −0.03em, line-height 1.05
- `font-variant-numeric: tabular-nums` — cifras alineadas, relevante para precios

### Logo y assets
- `public/images/icons/smashly-large-icon.png` — logo principal: wordmark "Smashly" en 3D verde brillante
  con extrusión, la "s" sustituida por una **pala de pádel negra en diagonal** (con agujeros) y una
  **pelota amarillo-lima** flotando arriba a la derecha. Fondo transparente.
- `public/images/icons/smashly-icon.png` — favicon 512×512
- `public/images/og/smashly-og-1200x630.png` — Open Graph
- Iconografía UI: **Phosphor Icons**
- Las imágenes de palas van siempre sobre un **tile blanco** (#ffffff, radio 12–16px, borde 1px #e5e7eb)

### Look & feel para IA generativa
Verde bosque profundo → verde vibrante (#0f2818 → #16a34a), texto blanco, superficies casi blancas con
tinte verde, acentos ámbar (#d97706) y pelota amarillo-lima. Grano muy suave al 3%.

---

## 3. Tono de voz

**Destilado**: tuteo directo y cercano. Frases cortas. Verbos en imperativo ("Compara", "Filtra",
"Encuentra", "Descubre"). Vocabulario técnico del pádel sin condescendencia (peso, balance, forma,
núcleo, dureza) pero siempre traducido a beneficio. Confianza basada en datos, no en hype:
"datos reales", "+800 palas analizadas", "precios en tiempo real". Cero jerga de startup.
Emoji casi ausente en producto. "Nosotros" como equipo pequeño y cómplice.

### Copy literal reutilizable en vídeo

**Hero H1** (segunda línea rota cada 2,5 s en ámbar):
> "La herramienta que te permite **encontrar tu pala ideal** / **comparar precios al instante** / **mejorar tu rendimiento** / **elegir con confianza**"

**Subtítulo**:
> "Compara más de 800 palas de pádel con datos reales: peso, balance, forma, materiales y precio. Filtra, compara y encuentra la pala que se ajusta a tu juego."

**CTAs**: "Encontrar mi pala ideal" · "Explorar catálogo"
**Trust bar**: "+800 palas analizadas" · "Sin registro obligatorio"

**Cómo funciona**: "Encontrar tu pala ideal es simple" / "Tres pasos para descubrir la pala perfecta para tu juego"
1. "Cuéntanos tu estilo"
2. "Recibe recomendaciones" — "Nuestra IA analiza tu perfil y te sugiere las palas que mejor se adaptan a ti."
3. "Compara y elige"

**Features**: "Todo lo que necesitas para elegir bien" / "Herramientas pensadas para jugadores que saben lo que quieren"
- "Compara hasta 3 palas lado a lado"
- "Encuentra tu pala en segundos"

**Testimonio (el único social proof real)**:
> "Gracias a Smashly encontré la pala que necesitaba. En 5 minutos supe exactamente qué modelo comprar y dónde conseguirlo más barato."
> — Carlos Martínez, jugador amateur, Madrid

**Footer**: "© 2025 Smashly. Hecho con ♥ para los amantes del pádel."

**Canales**: IG @smashly.app · TikTok @smashlyapp · X @smashly_app · LinkedIn /company/smashly-ai · hello@smashly.app

### Corregir si se locuta
- La home dice "**Respondé** unas pocas preguntas" — voseo, incoherente con el tuteo del resto. Usa "Responde".
- El eslogan del banner está en inglés mientras el producto es 100% español.
- El FAQ dice que los favoritos "estarán disponibles próximamente" cuando ya están implementados.

---

## 4. Ángulos narrativos validados por el copy real

| Ángulo | Insight | Frase ancla |
|---|---|---|
| **Ansiedad de compra** | gastar 200–300 € sin saber si es la pala correcta | "elegir con confianza" |
| **Ahorro y velocidad** | comparar precios entre tiendas es tedioso | "En 5 minutos supe qué comprar y dónde más barato" |
| **Fricción cero** | competidores exigen registro | "Sin registro obligatorio" |
| **Autoridad de datos** | opiniones vs datos | "+800 palas analizadas", "datos reales" |

Ángulos extra disponibles en `docs/PREMIUM_FEATURES.md` (features premium con palanca psicológica
explícita): predictor de lesiones (semáforo bajo/medio/alto por codo, muñeca, hombro),
"juega como el pro" (equivalente a la pala de Arturo Coello para tu nivel y presupuesto),
señales de compra ("precio mínimo histórico 149 €, ahora 159 €, suele bajar en Black Friday,
espera 3 semanas"), dashboard de valor residual, IA Coach conversacional.

---

## 5. Pantallas clave (para demos y image-to-video)

- **Catálogo** — grid/lista, búsqueda fuzzy, filtros por marca/forma/balance/núcleo/cara/nivel/tipo/dureza y precio, badges "Bestseller" y "Oferta" con % y precio tachado, mejor precio por tienda
- **Detalle de pala** — ficha técnica, tabla de precios por tienda con enlace de compra, **gráfico radar** (Potencia, Control, S. Bola, Manej., P. Dulce), **histórico de precios**, reseñas con estrellas
- **Comparador** — tabla de hasta 3 palas lado a lado, radar superpuesto, análisis IA de pros/contras, panel flotante persistente, compartir por link público, export PDF
- **Recomendador IA** — wizard (modo básico sin login / avanzado con sesión), pantalla "Analizando tu perfil con IA…", resultado con explicación
- **Listas/favoritos**, **reseñas**, **dashboards** de jugador/tienda, **panel admin**

### Screenshots disponibles
`screenshots/` — set actual, desktop + móvil emparejados (**lo mejor para image-to-video vertical**):
```
01-homepage-desktop.png      02-homepage-mobile.png
03-catalog-desktop.png       04-catalog-mobile.png
05-compare-desktop.png       06-compare-mobile.png
07-best-racket-desktop.png   08-best-racket-mobile.png
09-faq-desktop.png           10-faq-mobile.png
11-racket-detail-desktop.png 12-racket-detail-mobile.png
13-pwa-prompt-desktop.png    14-pwa-prompt-mobile.png
```
`docs/readme-images/` — set del README (UI más antigua).
`testing/test-results/` — grabaciones y trazas de Playwright, útiles para UI en movimiento.
Script de grabación: `pnpm record:demo` → `testing/scripts/record-demo.cjs`.

**Para vídeo vertical usa siempre los `*-mobile.png`**: son 9:16 nativos y evitan que Veo tenga que
recomponer un screenshot horizontal.

---

## 6. Stack (contexto)

React 18 + TypeScript + Vite 7, TanStack (Router/Query/Form/Virtual), **styled-components** (sin Tailwind),
framer-motion, Phosphor Icons, Recharts, Fuse.js. Backend: funciones serverless de Vercel en `api/`.
Datos: Supabase (Postgres + Auth + RLS). IA: OpenRouter + RAG con embeddings. Scrapers en Python
para 5 tiendas + métricas radar de PadelZoom.es y TuMejorPala.com. Monorepo pnpm, deploy en Vercel.
