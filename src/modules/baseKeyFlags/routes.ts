import { Router } from "express";
import { z } from "zod";
import { BaseKeyFlagsRepository } from "@/modules/baseKeyFlags/repository";
import { BaseKeyFlagsService } from "@/modules/baseKeyFlags/service";
import { BaseKeyFlagsController } from "@/modules/baseKeyFlags/controller";
import { authMiddleware } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { db } from "@/config/db";
import { redis } from "@/config/redis";

const createFeatureSchema = z.object({
  key: z.string().min(2).max(64),
  displayName: z.string().min(2).max(120),
  releasedTo: z.enum(["none", "premium", "all"]).default("none")
});

const updateReleaseSchema = z.object({
  releasedTo: z.enum(["none", "premium", "all"])
});

const checkAccessSchema = z.object({
  userTier: z.enum(["free", "premium"])
});

const repository = new BaseKeyFlagsRepository(db, redis);
const service = new BaseKeyFlagsService(repository);
const controller = new BaseKeyFlagsController(service);

export const baseKeyFlagRoutes = Router();

baseKeyFlagRoutes.get("/", asyncHandler(controller.listFeatures));
baseKeyFlagRoutes.get("/analytics/by-tier", asyncHandler(controller.getUsageByTier));
baseKeyFlagRoutes.get("/analytics/popularity", asyncHandler(controller.getFeaturePopularity));
baseKeyFlagRoutes.get("/analytics/last-seen", asyncHandler(controller.getLastSeen));
baseKeyFlagRoutes.get("/:key", asyncHandler(controller.getFeatureByKey));
baseKeyFlagRoutes.post(
  "/",
  authMiddleware,
  validateBody(createFeatureSchema),
  asyncHandler(controller.createFeature)
);
baseKeyFlagRoutes.patch(
  "/:key/release",
  authMiddleware,
  validateBody(updateReleaseSchema),
  asyncHandler(controller.updateReleaseTarget)
);
baseKeyFlagRoutes.post(
  "/:key/check",
  validateBody(checkAccessSchema),
  asyncHandler(controller.checkAccess)
);
