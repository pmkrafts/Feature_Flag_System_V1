import {
  BaseKeyFeature,
  BaseKeyFlagsRepository,
  ReleaseTarget,
  UserTier
} from "@/modules/baseKeyFlags/repository";
import { AppError } from "@/utils/appError";

type AccessEvaluation = {
  featureKey: string;
  releasedTo: ReleaseTarget;
  userTier: UserTier;
  allowed: boolean;
};

type UsageByTier = {
  featureKey: string;
  userTier: UserTier;
  totalUses: number;
};

type FeaturePopularity = {
  featureKey: string;
  usageCount: number;
};

type FeatureLastSeen = {
  featureKey: string;
  lastSeen: string | null;
};

export class BaseKeyFlagsService {
  constructor(private readonly repository: BaseKeyFlagsRepository) {}

  async listFeatures(): Promise<BaseKeyFeature[]> {
    return this.repository.getAllFeatures();
  }

  async getFeatureByKey(key: string): Promise<BaseKeyFeature> {
    const feature = await this.repository.getFeatureByKey(key);

    if (!feature) {
      throw new AppError("Feature not found", 404);
    }

    return feature;
  }

  async createFeature(key: string, displayName: string, releasedTo: ReleaseTarget): Promise<BaseKeyFeature> {
    const existing = await this.repository.getFeatureByKey(key);

    if (existing) {
      throw new AppError("Feature key already exists", 409);
    }

    return this.repository.createFeature(key, displayName, releasedTo);
  }

  async updateReleaseTarget(key: string, releasedTo: ReleaseTarget): Promise<BaseKeyFeature> {
    const updated = await this.repository.updateReleaseTarget(key, releasedTo);

    if (!updated) {
      throw new AppError("Feature not found", 404);
    }

    return updated;
  }

  async evaluateAccess(featureKey: string, userTier: UserTier): Promise<AccessEvaluation> {
    const feature = await this.repository.getFeatureByKey(featureKey);

    if (!feature) {
      throw new AppError("Feature not found", 404);
    }

    const allowed =
      feature.releasedTo === "all" ||
      (feature.releasedTo === "premium" && userTier === "premium");

    if (allowed) {
      await this.repository.createUsageLog(feature.key, userTier, true);
    }

    return {
      featureKey: feature.key,
      releasedTo: feature.releasedTo,
      userTier,
      allowed
    };
  }

  async getUsageByTier(): Promise<UsageByTier[]> {
    const totals = new Map<string, UsageByTier>();

    const logs = await this.repository.getAllUsageLogs();

    logs.forEach((log) => {
      const mapKey = `${log.featureKey}::${log.userTier}`;
      const current = totals.get(mapKey);

      if (current) {
        current.totalUses += 1;
        return;
      }

      totals.set(mapKey, {
        featureKey: log.featureKey,
        userTier: log.userTier,
        totalUses: 1
      });
    });

    return [...totals.values()];
  }

  async getFeaturePopularity(hours = 24): Promise<FeaturePopularity[]> {
    const minDate = Date.now() - hours * 60 * 60 * 1000;
    const totals = new Map<string, number>();

    const logs = await this.repository.getAllUsageLogs();

    logs.forEach((log) => {
      const createdAtMs = new Date(log.createdAt).getTime();

      if (createdAtMs <= minDate) {
        return;
      }

      const current = totals.get(log.featureKey) ?? 0;
      totals.set(log.featureKey, current + 1);
    });

    return [...totals.entries()].map(([featureKey, usageCount]) => ({
      featureKey,
      usageCount
    }));
  }

  async getLastSeen(): Promise<FeatureLastSeen[]> {
    const [features, logs] = await Promise.all([
      this.repository.getAllFeatures(),
      this.repository.getAllUsageLogs()
    ]);

    return features.map((feature) => {
      const featureLogs = logs.filter((log) => log.featureKey === feature.key);
      const lastSeen = featureLogs
        .map((log) => log.createdAt)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

      return {
        featureKey: feature.key,
        lastSeen: lastSeen ?? null
      };
    });
  }
}
