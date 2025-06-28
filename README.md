# 🏓 Smashly - Tu Asistente Inteligente para Palas de Pádel

**Smashly** es una aplicación móvil innovadora que utiliza **Inteligencia Artificial** para ayudar a los jugadores de pádel a encontrar la pala perfecta según su perfil, comparar múltiples modelos y acceder a información actualizada del mercado.

![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Google AI](https://img.shields.io/badge/Google_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

## 🌟 Características Principales

### 🤖 **Recomendaciones con IA (Gemini)**

- Análisis personalizado basado en nivel de juego, estilo y características físicas
- Recomendaciones múltiples con porcentajes de compatibilidad
- Explicaciones detalladas de por qué cada pala es recomendada

### ⚖️ **Comparador Inteligente de Palas**

- Selección de 2-3 palas para comparación detallada
- Análisis comparativo generado por IA
- Pros y contras de cada modelo
- Recomendación final personalizada

### 🔍 **Base de Datos Actualizada**

- Más de 100 palas de las mejores marcas
- Precios actualizados y ofertas en tiempo real
- Filtros por marca, precio y características
- Imágenes de alta calidad

### 📱 **Interfaz Moderna y Responsive**

- Diseño adaptativo para móviles, tablets y desktop
- Grid optimizado con 2-4 palas por fila según el dispositivo
- Animaciones suaves y feedback visual
- Modo oscuro/claro (próximamente)

### 💬 **Sistema de Soporte**

- Modal de contacto integrado
- Envío de emails automático con EmailJS
- FAQ con preguntas frecuentes
- Soporte técnico dedicado

## 🛠️ Tecnologías Utilizadas

### **Frontend & Framework**

- **React Native** - Framework principal para desarrollo móvil
- **Expo** - Plataforma de desarrollo y deployment
- **TypeScript** - Tipado estático para mayor robustez
- **Expo Router** - Navegación basada en archivos

### **Inteligencia Artificial**

- **Google Gemini AI** (gemini-1.5-flash) - Análisis y recomendaciones
- **Prompts optimizados** para análisis técnico de palas
- **Procesamiento de lenguaje natural** para respuestas contextuales

### **APIs y Servicios**

- **EmailJS** - Servicio de emails sin backend
- **Google Custom Search API** - Búsqueda de imágenes
- **Expo Image Picker** - Selección de imágenes
- **Variables de entorno** para configuración segura

### **UI/UX**

- **React Native Elements** - Componentes UI
- **Ionicons** - Iconografía moderna
- **Custom Components** - Botones, inputs y tarjetas personalizadas
- **Responsive Design** - Adaptativo a todos los dispositivos

### **Gestión de Datos**

- **JSON Database** - Base de datos local de palas
- **AsyncStorage** - Persistencia local (futuro)
- **Estado global** con React Hooks

## 🚀 Proceso de Desarrollo

### **1. Planificación y Arquitectura**

```
📁 Estructura del Proyecto
├── app/                    # Pantallas principales (Expo Router)
│   ├── index.tsx          # Página de inicio
│   ├── rackets.tsx        # Hub de funcionalidades
│   ├── best-racket.tsx    # Recomendaciones IA
│   ├── compare-rackets.tsx # Comparador
│   ├── faq.tsx            # Preguntas frecuentes
│   └── _layout.tsx        # Layout y navegación
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── ui/           # Botones, inputs, etc.
│   │   └── feature/      # Componentes específicos
│   ├── utils/            # Utilidades y servicios
│   │   ├── gemini.ts     # Integración con Gemini AI
│   │   └── email.service.tsx # Servicio de emails
│   ├── types/            # Definiciones TypeScript
│   └── styles/           # Estilos globales
└── palas_padel.json      # Base de datos de palas
```

### **2. Integración de IA**

1. **Configuración de Gemini AI**

   - Setup de API keys en variables de entorno
   - Creación de prompts especializados para análisis de palas
   - Manejo de errores y timeouts

2. **Desarrollo de Algoritmos**
   - Análisis de perfil de jugador (nivel, estilo, físico)
   - Matching inteligente con base de datos
   - Generación de explicaciones contextuales

### **3. Sistema de Comparación**

1. **Selección Multiple**

   - Sistema de selección de hasta 3 palas
   - Feedback visual con checkmarks
   - Contador dinámico

2. **Análisis Comparativo**
   - Prompts específicos para comparación
   - Análisis de pros/contras
   - Recomendaciones finales personalizadas

### **4. UI/UX Responsive**

1. **Layout Adaptativo**

   ```typescript
   // Sistema de breakpoints dinámicos
   width: screenWidth > 1200
     ? (screenWidth - 40) / 4 - 8 // 4 columnas
     : screenWidth > 800
     ? (screenWidth - 32) / 3 - 8 // 3 columnas
     : (screenWidth - 24) / 2 - 8; // 2 columnas
   ```

2. **Optimizaciones de Rendimiento**
   - Lazy loading de imágenes
   - Paginación de resultados
   - Debounce en búsquedas

### **5. Sistema de Comunicación**

1. **EmailJS Integration**
   - Configuración de plantillas de email
   - Validación de formularios
   - Manejo de errores de envío

## 📦 Instalación y Configuración

### **Prerrequisitos**

- Node.js (v18 o superior)
- npm o yarn
- Expo CLI
- Cuenta de Google AI Studio
- Cuenta de EmailJS

### **1. Clonar el Repositorio**

```bash
git clone [repository-url]
cd smashly-app
```

### **2. Instalar Dependencias**

```bash
npm install
```

### **3. Configurar Variables de Entorno**

Crear archivo `.env` en la raíz:

```env
# Gemini AI
EXPO_PUBLIC_GEMINI_API_KEY=tu_gemini_api_key

# Google Search API
EXPO_PUBLIC_GOOGLE_API_KEY=tu_google_api_key
EXPO_PUBLIC_GOOGLE_CX=tu_custom_search_engine_id

# EmailJS
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=tu_emailjs_public_key
EXPO_PUBLIC_EMAILJS_SERVICE_ID=tu_service_id
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=tu_template_id
```

### **4. Ejecutar la Aplicación**

```bash
npx expo start
```

## 🔧 Configuración de Servicios

### **Google AI Studio (Gemini)**

1. Crear cuenta en [ai.google.dev](https://ai.google.dev)
2. Generar API key
3. Configurar límites de uso

### **EmailJS**

1. Crear cuenta en [emailjs.com](https://emailjs.com)
2. Configurar servicio de email
3. Crear plantilla de contacto
4. Obtener keys de configuración

### **Google Custom Search**

1. Crear proyecto en Google Cloud Console
2. Habilitar Custom Search API
3. Crear motor de búsqueda personalizado
4. Configurar filtros de imágenes

## 📱 Funcionalidades Detalladas

### **🎯 Recomendador Inteligente**

- **Input**: Nivel, estilo, peso, altura, presupuesto, forma preferida
- **Procesamiento**: Análisis con Gemini AI de +100 palas
- **Output**: 3 recomendaciones rankeadas con explicaciones

### **⚖️ Comparador Avanzado**

- **Selección visual** de palas con interfaz intuitiva
- **Análisis comparativo** con IA especializada
- **Resultado detallado** con pros/contras y recomendación final

### **🔍 Búsqueda y Filtros**

- **Búsqueda en tiempo real** por nombre y marca
- **Filtros por marca** con chips interactivos
- **Grid responsive** optimizado para cada dispositivo

## 🚀 Próximas Características

- [ ] **Sistema de usuarios** con perfiles personalizados
- [ ] **Favoritos** y listas de deseos
- [ ] **Comparación de precios** en tiempo real
- [ ] **Notificaciones** de ofertas y nuevos modelos
- [ ] **Reseñas** y valoraciones de usuarios
- [ ] **Realidad aumentada** para visualización de palas
- [ ] **Integración con tiendas** para compra directa

## 🤝 Contribución

Este proyecto está abierto a contribuciones. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Desarrollador

**Teije** - _Desarrollador Full Stack & AI Engineer_

- Especialización en React Native y tecnologías móviles
- Experiencia en integración de IA y machine learning
- Enfoque en UX/UI y desarrollo responsive

---

## 📞 Soporte

¿Tienes preguntas o sugerencias?

- 📧 **Email**: soporte@smashly.com
- 💬 **FAQ**: Sección de preguntas frecuentes en la app
- 🐛 **Bugs**: Abre un issue en GitHub

---

_Desarrollado con ❤️ para la comunidad de pádel_
