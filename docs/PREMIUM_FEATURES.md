# Smashly Premium — Ideas de Funcionalidades

> Documento de referencia para la estrategia de monetización post-TFG.
> Infraestructura base ya lista: `ContentLock`, `BlurTeaser`, RBAC, OpenRouter, RAG, embeddings, price_history.

---

## Tiers Propuestos

| Tier | Target | Precio estimado |
|---|---|---|
| **Player Pro** | Jugadores individuales | 3-5 €/mes |
| **Store Pro** | Tiendas y distribuidores | 20-40 €/mes |
| **Club / Academia** | Entrenadores y academias | 30-60 €/mes |
| **Developer API** | Apps y plataformas terceras | Por uso / plan |

---

## TIER PLAYER PRO

### Alta Prioridad — Features que generan deseo fuerte de pagar

#### 1. IA Coach Conversacional
Chat libre con IA que conoce tu perfil completo (físico, nivel, lesiones, presupuesto, estilo) y todo el catálogo de palas.

- No formulario — conversación real
- Contexto persistente entre sesiones
- Puede responder: *"Tengo codo de tenista, juego en defensa, budget 180€, ¿qué me recomiendas?"*
- **Base técnica ya disponible:** OpenRouter + RAG + embeddings de palas

**Palanca psicológica:** Necesidad + Comodidad. Nadie en el mercado del pádel tiene esto.

---

#### 2. Predictor de Lesiones por Pala
Score de riesgo biomecánico personalizado para cada pala basado en tus métricas físicas y lesiones previas.

- Evalúa: balance, dureza del núcleo, peso, punto de impacto
- Output: semáforo de riesgo (BAJO / MEDIO / ALTO) por zona corporal (codo, muñeca, hombro)
- Ejemplo: *"Esta pala tiene balance alto y core duro — riesgo ALTO para tu codo derecho"*
- Excluye automáticamente palas peligrosas en el modo de recomendación

**Palanca psicológica:** Miedo a lesión. Jugadores con historial de lesiones pagan sin dudar.

---

#### 3. "Juega como el Pro"
Mapa de palas que usan jugadores WPT/APT → IA encuentra la equivalente más cercana para tu nivel y presupuesto.

- Base de datos de equipamiento de pros del circuito
- Matching por características técnicas, no solo por marca
- Ejemplo: *"Arturo Coello usa Bullpadel Vertex 03. Para tu nivel y budget de 160€, la equivalente es X"*
- Actualizable con cada temporada del circuito

**Palanca psicológica:** Aspiracional + FOMO. Datos públicos + catálogo + IA = feature única en el mercado.

---

#### 4. Señales de Compra Inteligentes
Análisis predictivo de precios basado en patrones históricos — no solo alertas de bajada, sino recomendaciones de timing.

- *"Precio mínimo histórico: 149€. Ahora: 159€. Suele bajar en Black Friday. Espera 3 semanas."*
- *"Bajó 40€ esta semana. Probabilidad de seguir bajando: baja. Compra ahora."*
- Alertas configurables por pala + umbral de precio
- Score de "momento de compra" (1-10)
- **Base técnica ya disponible:** `price_history` en BD, infraestructura de notificaciones

**Palanca psicológica:** ROI tangible e inmediato. Ahorrar 30€ en una pala de 200€ = suscripción pagada para siempre.

---

#### 5. Test de Compatibilidad Pala Actual
Análisis de si tu pala actual es la correcta para cómo juegas realmente.

- Input: descripción de tu juego o pala actual
- Output: diagnóstico de desajuste + palas mejor alineadas
- Ejemplo: *"Juegas en bandeja y víbora pero tienes pala de potencia. Estás dejando rendimiento encima de la pista."*
- Genera urgencia de cambio real basada en datos técnicos

**Palanca psicológica:** Inseguridad → solución clara. Genera conversión directa a compra.

---

#### 6. Dashboard de Valor Residual
Estimación del valor de mercado de segunda mano de tu pala actual y proyección futura.

- *"Tu Bullpadel Vertex vale ~120€ usada ahora. En 6 meses, cuando salga la nueva versión, caerá a ~80€."*
- Ayuda a decidir cuándo vender y cuándo comprar nueva
- Calendario de lanzamientos de nuevas versiones (si disponible)
- Integrable con mercados de segunda mano (Wallapop, etc.)

**Palanca psicológica:** Ahorro + inteligencia financiera aplicada al equipamiento.

---

### Media Prioridad — Mejoras de experiencia que refuerzan retención

#### 7. Comparar hasta 5 Palas
Actualmente limitado a 3 simultáneas. Premium sube el límite.

#### 8. Perfiles de Recomendación Múltiples
Guarda distintos perfiles (e.g., "yo en invierno", "mi compañero", "para regalar") y alterna entre ellos.

#### 9. Historial de Precios Extendido
- Free: 30 días
- Premium: 12+ meses con gráficas avanzadas y exportación

#### 10. PDF sin Marca de Agua
Exportación de comparativas y fichas técnicas sin branding de Smashly.

#### 11. Historial de Palas Propias
Registro de todas las palas que has tenido, con notas personales y fechas. Útil para ver evolución y evitar repetir errores.

#### 12. "Mi Evolución"
Dashboard que muestra cómo ha cambiado tu perfil de juego y recomendaciones con el tiempo. Visualización de progresión.

#### 13. Listas Ilimitadas
- Free: máximo 3-5 listas guardadas
- Premium: ilimitadas + ordenación avanzada + exportación

#### 14. Modo Oscuro
Activable solo en premium (funcionalidad ya infraestructurada en el proyecto).

---

## TIER STORE PRO

#### 15. Listing Destacado en Catálogo
Palas con stock en la tienda aparecen con badge y posición preferente en resultados de búsqueda y catálogo.

#### 16. Analytics de Tienda
Dashboard con métricas reales de comportamiento de usuarios:
- Cuántos usuarios ven tus precios
- Qué palas comparan los usuarios cuando tu precio aparece
- Conversión vs competidores (precio más bajo capturado)
- Tendencias de búsqueda del catálogo

#### 17. Badge "Oferta Exclusiva"
Badge diferenciado en el catálogo para promociones activas de la tienda.

#### 18. Sincronización de Inventario vía API
En vez de scraping manual → tienda sube su catálogo y precios directamente por API. Actualizaciones en tiempo real.

#### 19. Perfil de Tienda Rico
- Fotos de la tienda y equipo
- Vídeos de presentación
- Descripción extendida y especialidades
- Promociones y descuentos destacados
- Horarios y contacto directo

#### 20. Leads de Intención (con consentimiento)
Usuarios que compararon palas donde tu tienda era la opción más competitiva — datos anonimizados de interés.

---

## TIER CLUB / ACADEMIA

#### 21. Dashboard Multi-Perfil para Entrenadores
Gestión centralizada de perfiles de todos los alumnos desde una sola cuenta.

- Ver recomendaciones personalizadas para cada alumno
- Comparar palas para grupos de alumnos con perfil similar
- Exportar informes por alumno en PDF
- Notas privadas del entrenador por jugador

**Ticket:** 1 entrenador con 20 alumnos = 30-60€/mes sin fricción. B2B de alto valor.

#### 22. Sesiones de Selección Grupal
Herramienta para hacer sesiones de selección de equipamiento en grupo (academia, equipo de club).

#### 23. Branding Personalizado en Exportaciones
PDFs con logo de la academia en lugar de Smashly.

---

## FEATURES FUTURAS — Alto Impacto, Mayor Desarrollo

#### 24. Análisis de Vídeo de Juego
Sube un clip de un partido → IA analiza tu estilo de golpeo y recomienda pala basándose en movimiento real.

#### 25. Integración con Rankings Oficiales
Conecta tu perfil de FPP/WPT → IA ajusta recomendaciones a tu nivel real certificado, no autodeclarado.

#### 26. Calculadora de Tensión de Encordado
Basada en tu pala, estilo de juego y condiciones habituales de pista → tensión óptima de cuerdas.

#### 27. Calculadora de Grip Size
Input: medidas de mano → talla de grip ideal + comparativa entre marcas.

#### 28. Comunidad Premium (Foro / Q&A)
Acceso a foro privado con otros jugadores premium + posibilidad de preguntar a expertos certificados.

#### 29. API Pública para Desarrolladores
Acceso al catálogo, precios, métricas técnicas y embeddings para apps terceras.
- Free tier: 100 requests/mes
- Paid: por volumen

---

## Stack de Pagos Recomendado

**Stripe** — soporte nativo España/EUR, Stripe Billing para suscripciones recurrentes, Stripe Checkout para onboarding rápido.

Tablas de BD necesarias:
- `subscriptions` — tier, estado, fechas, stripe_subscription_id
- `payment_history` — facturas y pagos
- `feature_flags` — overrides por usuario si necesario

---

## Roadmap de Implementación Sugerido

| Fase | Features | Razón |
|---|---|---|
| **Fase 1** | Señales de compra + alertas de precio | Infraestructura casi lista, ROI inmediato |
| **Fase 1** | Límites de listas/comparaciones + ContentLock | 2 líneas de código, genera fricción que convierte |
| **Fase 2** | IA Coach conversacional | Mayor diferencial, base técnica ya disponible |
| **Fase 2** | Predictor de lesiones | Alta conversión en segmento con lesiones |
| **Fase 3** | "Juega como el Pro" | Aspiracional, requiere datos de pros |
| **Fase 3** | Store Pro analytics | B2B, ticket alto |
| **Fase 4** | Club/Academia dashboard | Máximo ticket, mayor complejidad |
| **Futuro** | Análisis de vídeo, rankings oficiales | I+D, largo plazo |
