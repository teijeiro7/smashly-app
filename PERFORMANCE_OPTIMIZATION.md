# Smashly - Optimización de Performance PWA

## Estado Actual (Post-Optimizaciones)

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| FCP (móvil) | 17.5-18.7s | 8.7-9.3s | **50%+** |
| LCP (móvil) | 38.8-52.9s | 9.2-12.5s | **70%+** |
| CLS | 0.028 | 0.009 | **68%** |
| Imágenes offscreen | 3 | 0 | ✅ |

## Problema Original
- Animaciones laggy en móvil (menú, scroll, banner dinámico)
- Afectaba tanto PWA como navegador móvil

## Soluciones Implementadas

### 1. Animaciones → CSS Puro
- `RotatingPhrases.tsx`: Framer Motion → CSS keyframes
- `FeatureCards` (Home): whileInView → CSS animations
- Menú móvil: stagger animations → CSS simple
- AiBanner: motion buttons → CSS transitions

### 2. Bundle Optimizations
- Vite: target es2020, code splitting
- Lazy loading de recharts (RacketRadarChartLazy)
- Preload fuentes + print media trick

### 3. Componentes Optimizados
- RacketCard: `contain: layout style paint`
- Imágenes: `loading="lazy" decoding="async"`
- AdvancedFiltersPanel: motion → CSS toggle

## Archivos Modificados
- `frontend/src/App.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/CatalogPage.tsx`
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/features/AiBanner.tsx`
- `frontend/src/components/features/RacketCard.tsx`
- `frontend/src/components/features/RotatingPhrases.tsx`
- `frontend/vite.config.ts`
- `frontend/index.html`

## Siguiente Paso Pendiente
- Analizar libs no usadas (~23MB desperdiciado)
- Virtualizar listas del catálogo
- Optimizar imágenes (WebP, responsive)

## Tech Stack
- React 18 + Vite
- Framer Motion (optimizado)
- Recharts, styled-components
- PWA con Workbox