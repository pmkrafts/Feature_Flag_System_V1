import { Request, Response } from "express";
import { BaseKeyFlagsService } from "@/modules/baseKeyFlags/service";
import { sendSuccess } from "@/utils/apiResponse";
import { AppError } from "@/utils/appError";

export class BaseKeyFlagsController {
  constructor(private readonly service: BaseKeyFlagsService) {}

  listFeatures = (_req: Request, res: Response): Response => {
    return sendSuccess(res, this.service.listFeatures());
  };

  getFeatureByKey = (req: Request, res: Response): Response => {
    return sendSuccess(res, this.service.getFeatureByKey(req.params.key));
  };

  createFeature = (req: Request, res: Response): Response => {
    const { key, displayName, releasedTo } = req.body;
    const created = this.service.createFeature(key, displayName, releasedTo);
    return sendSuccess(res, created, 201);
  };

  updateReleaseTarget = (req: Request, res: Response): Response => {
    const { releasedTo } = req.body;
    const updated = this.service.updateReleaseTarget(req.params.key, releasedTo);
    return sendSuccess(res, updated);
  };

  checkAccess = (req: Request, res: Response): Response => {
    const { userTier } = req.body;
    const result = this.service.evaluateAccess(req.params.key, userTier);
    return sendSuccess(res, result);
  };

  getUsageByTier = (_req: Request, res: Response): Response => {
    return sendSuccess(res, this.service.getUsageByTier());
  };

  getFeaturePopularity = (req: Request, res: Response): Response => {
    const rawHours = req.query.hours;
    const hours = rawHours === undefined ? 24 : Number(rawHours);

    if (!Number.isFinite(hours) || hours <= 0) {
      throw new AppError("hours must be a positive number", 400);
    }

    return sendSuccess(res, this.service.getFeaturePopularity(hours));
  };

  getLastSeen = (_req: Request, res: Response): Response => {
    return sendSuccess(res, this.service.getLastSeen());
  };
}
