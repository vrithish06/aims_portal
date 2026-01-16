// backend/server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import AimsRoutes from "./routes/AimsRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/", AimsRoutes);

app.listen(3000, () => {
  console.log("server is running on port 3000");
});