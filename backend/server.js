import dns from "node:dns";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import AimsRoutes from "./routes/AimsRoutes.js";

// Force IPv4 to avoid ENETUNREACH on specific platforms (like Render) connecting to Supabase
if (dns && dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (e) { /* ignore */ }
}

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
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = [
  "http://localhost:5173",
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
console.log("[SESSION] Mode:", isProduction ? "PRODUCTION" : "DEVELOPMENT");

// ⚠️ BYPASS: Falling back to MemoryStore as requested to fix deployment issues.
// Providing a null store forces express-session to use MemoryStore.
// Note: Sessions will be lost on server restart.
const sessionStore = null;

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
    sameSite: isProduction ? "none" : "lax", // 'none' for cross-site if needed
    maxAge: 24 * 60 * 60 * 1000,  // 1 day
    path: "/"
  }
};

if (isProduction) {
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = 'none';
}

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
  console.log(`✅ Server running on port ${PORT} - Reloaded (Timezone Fix Final) ${new Date().toISOString()}`);
});
