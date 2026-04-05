import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { errorHandler } from "@/middlewares/errorHandler";
import { notFound } from "@/middlewares/notFound";
import { requestLogger } from "@/middlewares/requestLogger";
import { apiRouter } from "@/routes";

export const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX
  })
);

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler);
