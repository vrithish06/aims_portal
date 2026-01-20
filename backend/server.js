import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import dotenv from "dotenv";

import AimsRoutes from "./routes/AimsRoutes.js";

dotenv.config();

const app = express();

/* -----------------------------
   BASIC MIDDLEWARE
------------------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  })
);

app.use(helmet());
app.use(morgan("dev"));

/* -----------------------------
   SESSION (CORRECT WAY)
------------------------------ */
app.use(
  session({
    name: "aims.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: false, // true only in HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

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
   ROUTES
------------------------------ */
app.use("/", AimsRoutes);

/* -----------------------------
   SERVER
------------------------------ */
app.listen(3000, () => {
  console.log("✅ Server running on port 3000");
});
