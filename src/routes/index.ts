import { Router } from "express";
import { sampleRoutes } from "@/modules/sample/routes";
import { sendSuccess } from "@/utils/apiResponse";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  return sendSuccess(res, {
    message: "API v1 is running",
    endpoints: ["/health", "/sample"]
  });
});

apiRouter.get("/health", (_req, res) => {
  return sendSuccess(res, { status: "ok" });
});

apiRouter.use("/sample", sampleRoutes);
