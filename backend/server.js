import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import dotenv from "dotenv";

import AimsRoutes from "./routes/AimsRoutes.js";

dotenv.config();

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

/* -----------------------------
   DEBUG (OPTIONAL)
------------------------------ */
app.use((req, res, next) => {
  console.log(
    "[SESSION]",
    "id:",
    req.sessionID,
    "exists:",
    !!req.session
  );
  next();
});

/* -----------------------------
   ROUTES (UNCHANGED)
------------------------------ */
app.use("/", AimsRoutes);

/* -----------------------------
   SERVER
------------------------------ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
