import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { validateConfig } from "./config";
import { RecommendationService } from "./services/recommendationService";

// Importar rutas
import racketRoutes from "./routes/rackets";
import userRoutes from "./routes/users";
import recommendationRoutes from "./routes/recommendations";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";

// Validar configuración al iniciar
validateConfig();

// Inicializar servicios
if (process.env.GEMINI_API_KEY) {
  RecommendationService.initialize(process.env.GEMINI_API_KEY);
} else {
  console.warn(
    "⚠️ GEMINI_API_KEY no configurada. Las recomendaciones con IA no estarán disponibles."
  );
}

// Crear la aplicación Express
const app = express();

// Middleware de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: {
    error: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Middleware general
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rutas principales
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rackets", racketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Endpoint de documentación básica
app.get("/api/docs", (req, res) => {
  res.json({
    title: "Smashly API Documentation",
    version: "1.0.0",
    description:
      "API REST para sistema de recomendación de palas de pádel con IA",
    endpoints: {
      health: "GET /api/health - Health check",
      auth: {
        "POST /api/auth/login": "Iniciar sesión",
        "POST /api/auth/register": "Registrar usuario",
        "POST /api/auth/logout": "Cerrar sesión",
        "POST /api/auth/refresh": "Refrescar token",
        "GET /api/auth/me": "Obtener usuario actual",
      },
      rackets: {
        "GET /api/rackets": "Obtener todas las palas",
        "GET /api/rackets/:id": "Obtener pala por ID",
        "GET /api/rackets/search": "Buscar palas",
        "GET /api/rackets/brands/:brand": "Palas por marca",
        "GET /api/rackets/bestsellers": "Palas bestsellers",
        "GET /api/rackets/offers": "Palas en oferta",
      },
      users: {
        "GET /api/users/profile": "Obtener perfil del usuario",
        "POST /api/users/profile": "Crear perfil de usuario",
        "PUT /api/users/profile": "Actualizar perfil de usuario",
        "DELETE /api/users/profile": "Eliminar perfil de usuario",
      },
      recommendations: {
        "POST /api/recommendations": "Obtener recomendaciones de palas",
        "GET /api/recommendations/history": "Historial de recomendaciones",
      },
    },
  });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "🏓 Smashly API - Sistema de Recomendación de Palas de Pádel",
    version: "1.0.0",
    status: "running",
    documentation: "/api/docs",
    health: "/api/health",
  });
});

// Middleware para manejar rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/health",
      "/api/rackets",
      "/api/users",
      "/api/recommendations",
      "/api/docs",
    ],
  });
});

// Middleware global de manejo de errores
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Error:", err);

    // Error de validación de Joi
    if (err.isJoi) {
      return res.status(400).json({
        error: "Validation error",
        details: err.details.map((detail: any) => detail.message),
      });
    }

    // Error de Supabase
    if (err.code && err.message) {
      return res.status(400).json({
        error: "Database error",
        message: err.message,
        code: err.code,
      });
    }

    // Error genérico
    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

export default app;
