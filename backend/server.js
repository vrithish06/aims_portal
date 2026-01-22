import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import AimsRoutes from "./routes/AimsRoutes.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ========================================
   ENVIRONMENT CONFIGURATION
======================================== */
console.log("[ENV] NODE_ENV:", process.env.NODE_ENV);
console.log("[ENV] FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("[ENV] BACKEND_URL:", process.env.BACKEND_URL);

const app = express();

/* ========================================
   BASIC MIDDLEWARE
======================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -----------------------------
   CORS (CORRECT)
------------------------------ */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log("[CORS] Allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("[CORS] Blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));

/* -----------------------------
   SESSION (LOCAL + RENDER SAFE)
------------------------------ */
const isProduction = process.env.NODE_ENV === "production";

console.log("[SESSION] Mode:", isProduction ? "PRODUCTION" : "DEVELOPMENT");

// Setup PostgreSQL session store
let sessionStore;
if (isProduction && process.env.DATABASE_URL) {
  // Production: Use PostgreSQL session store
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Render PostgreSQL
  });
  
  const PgSession = pgSession(session);
  sessionStore = new PgSession({
    pool,
    tableName: "session"
  });
  
  console.log("[SESSION] Using PostgreSQL session store");
} else {
  // Development: Use memory store (acceptable for local dev)
  console.log("[SESSION] Using memory store (development only)");
}

const sessionConfig = {
  name: "aims.sid",
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  proxy: isProduction,  // Trust proxy headers on Render
  cookie: {
    httpOnly: true,
    secure: isProduction,  // HTTPS on Render only
    sameSite: isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,  // 1 day
    path: "/"
  }
};

// Add session store if available
if (sessionStore) {
  sessionConfig.store = sessionStore;
}

// Add domain only in production
if (isProduction && process.env.BACKEND_URL) {
  const backendUrl = new URL(process.env.BACKEND_URL);
  sessionConfig.cookie.domain = backendUrl.hostname;
  console.log("[SESSION] Domain set to:", backendUrl.hostname);
}

console.log("[SESSION] Cookie config:", {
  httpOnly: sessionConfig.cookie.httpOnly,
  secure: sessionConfig.cookie.secure,
  sameSite: sessionConfig.cookie.sameSite,
  maxAge: sessionConfig.cookie.maxAge,
  path: sessionConfig.cookie.path
});

app.use(session(sessionConfig));

/* ========================================
   ROUTES ONLY (Frontend is deployed separately)
======================================== */
app.use("/", AimsRoutes);

/* ========================================
   HEALTH CHECK
======================================== */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ========================================
   ERROR HANDLER
======================================== */
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  res.status(500).json({ error: "Internal server error" });
});

/* ========================================
   404 HANDLER
======================================== */
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

/* ========================================
   SERVER START
======================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
