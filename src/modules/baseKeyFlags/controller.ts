import { Request, Response } from "express";
import { BaseKeyFlagsService } from "@/modules/baseKeyFlags/service";
import { sendSuccess } from "@/utils/apiResponse";
import { AppError } from "@/utils/appError";

export class BaseKeyFlagsController {
  constructor(private readonly service: BaseKeyFlagsService) {}

  listFeatures = async (_req: Request, res: Response): Promise<Response> => {
    return sendSuccess(res, await this.service.listFeatures());
  };

  getFeatureByKey = async (req: Request, res: Response): Promise<Response> => {
    return sendSuccess(res, await this.service.getFeatureByKey(req.params.key));
  };

  createFeature = async (req: Request, res: Response): Promise<Response> => {
    const { key, displayName, releasedTo } = req.body;
    const created = await this.service.createFeature(key, displayName, releasedTo);
    return sendSuccess(res, created, 201);
  };

  updateReleaseTarget = async (req: Request, res: Response): Promise<Response> => {
    const { releasedTo } = req.body;
    const updated = await this.service.updateReleaseTarget(req.params.key, releasedTo);
    return sendSuccess(res, updated);
  };

  checkAccess = async (req: Request, res: Response): Promise<Response> => {
    const { userTier } = req.body;
    const result = await this.service.evaluateAccess(req.params.key, userTier);
    return sendSuccess(res, result);
  };

  getUsageByTier = async (_req: Request, res: Response): Promise<Response> => {
    return sendSuccess(res, await this.service.getUsageByTier());
  };

  getFeaturePopularity = async (req: Request, res: Response): Promise<Response> => {
    const rawHours = req.query.hours;
    const hours = rawHours === undefined ? 24 : Number(rawHours);

    if (!Number.isFinite(hours) || hours <= 0) {
      throw new AppError("hours must be a positive number", 400);
    }

    return sendSuccess(res, await this.service.getFeaturePopularity(hours));
  };

  getLastSeen = async (_req: Request, res: Response): Promise<Response> => {
    return sendSuccess(res, await this.service.getLastSeen());
  };
}
