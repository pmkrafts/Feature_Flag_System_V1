import { Router } from "express";
import { sampleRoutes } from "@/modules/sample/routes";
import { baseKeyFlagRoutes } from "@/modules/baseKeyFlags/routes";
import { sendSuccess } from "@/utils/apiResponse";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  return sendSuccess(res, {
    message: "API v1 is running",
    endpoints: ["/health", "/sample", "/base-key-flags"]
  });
});

apiRouter.get("/health", (_req, res) => {
  return sendSuccess(res, { status: "ok" });
});

apiRouter.use("/sample", sampleRoutes);
apiRouter.use("/base-key-flags", baseKeyFlagRoutes);
