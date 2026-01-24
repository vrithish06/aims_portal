import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";

// Force IPv4 to avoid ENETUNREACH on specific platforms (like Render) connecting to Supabase
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

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

app.set("trust proxy", 1); // Trust first proxy (Render load balancer)

app.use(helmet());
app.use(morgan("dev"));

/* -----------------------------
   SESSION (LOCAL + RENDER SAFE)
------------------------------ */
const isProduction = process.env.NODE_ENV === "production";

console.log("[SESSION] Mode:", isProduction ? "PRODUCTION" : "DEVELOPMENT");

let sessionStore = null;

// Production: Use PostgreSQL session store
// DATABASE_URL should be set to Supabase PostgreSQL connection string in production
if (isProduction && process.env.DATABASE_URL) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for cloud PostgreSQL
    });

    // Test the connection
    pool.query("SELECT 1", (err) => {
      if (err) {
        console.error("[SESSION] PostgreSQL connection failed:", err.message);
      } else {
        console.log("[SESSION] ✅ PostgreSQL connection successful");
      }
    });

    const PgSession = pgSession(session);
    sessionStore = new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    });

    console.log("[SESSION] Using PostgreSQL session store (production mode)");
  } catch (err) {
    console.error("[SESSION] Failed to initialize PostgreSQL store:", err.message);
    console.log("[SESSION] Falling back to memory store");
  }
}

if (!sessionStore) {
  console.log("[SESSION] Using memory store for session persistence");
}

const sessionConfig = {
  name: "aims.sid",
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: true,  // ✅ MUST be true - saves session to DB on every request
  saveUninitialized: true,  // ✅ MUST be true - saves new sessions immediately
  proxy: isProduction,  // Trust proxy headers on Render
  rolling: true,  // Reset maxAge on every response (keeps session alive)
  cookie: {
    httpOnly: true,
    secure: isProduction,  // HTTPS on Render only
    sameSite: "lax",  // lax works for both localhost and production
    maxAge: 24 * 60 * 60 * 1000,  // 1 day
    path: "/"
  }
};

// Add session store if available
if (sessionStore) {
  sessionConfig.store = sessionStore;
}

console.log("[SESSION] Cookie config:", {
  httpOnly: sessionConfig.cookie.httpOnly,
  secure: sessionConfig.cookie.secure,
  sameSite: sessionConfig.cookie.sameSite,
  maxAge: sessionConfig.cookie.maxAge,
  path: sessionConfig.cookie.path,
  domain: sessionConfig.cookie.domain
});

app.use(session(sessionConfig));

/* ========================================
   SESSION DEBUG MIDDLEWARE
======================================== */
app.use((req, res, next) => {
  console.log(`[SESSION-DEBUG] ${req.method} ${req.path}`);
  console.log(`  - Session ID: ${req.sessionID}`);
  console.log(`  - Has Session: ${!!req.session}`);
  console.log(`  - Has User: ${!!req.session?.user}`);
  console.log(`  - User Email: ${req.session?.user?.email || 'none'}`);
  console.log(`  - Cookie: ${req.headers.cookie ? 'yes' : 'no'}`);
  next();
});

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
