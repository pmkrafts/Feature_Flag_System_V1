import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
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

const swaggerPath = path.resolve(process.cwd(), "swagger.yaml");
const swaggerDocument = YAML.load(swaggerPath);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler);
