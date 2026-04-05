import { Router } from "express";
import { z } from "zod";
import { SampleRepository } from "@/modules/sample/repository";
import { SampleService } from "@/modules/sample/service";
import { SampleController } from "@/modules/sample/controller";
import { asyncHandler } from "@/utils/asyncHandler";
import { authMiddleware } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validate";

const createSampleSchema = z.object({
  name: z.string().min(2, "name must be at least 2 characters")
});

const sampleRepository = new SampleRepository();
const sampleService = new SampleService(sampleRepository);
const sampleController = new SampleController(sampleService);

export const sampleRoutes = Router();

sampleRoutes.get("/", asyncHandler(sampleController.getSamples));
sampleRoutes.post(
  "/",
  authMiddleware,
  validateBody(createSampleSchema),
  asyncHandler(sampleController.addSample)
);
