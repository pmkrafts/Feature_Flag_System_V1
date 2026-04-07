export type ReleaseTarget = "none" | "premium" | "all";
export type UserTier = "free" | "premium";

export type BaseKeyFeature = {
  id: number;
  key: string;
  displayName: string;
  releasedTo: ReleaseTarget;
  updatedAt: string;
};

export type FeatureUsageLog = {
  id: number;
  featureKey: string;
  userTier: UserTier;
  success: boolean;
  createdAt: string;
};

type FeatureRecord = {
  id: number;
  key: string;
  displayName: string;
  releasedTo: ReleaseTarget;
  updatedAt: Date;
};

type UsageLogRecord = {
  id: number;
  featureKey: string;
  userTier: UserTier;
  success: boolean;
  createdAt: Date;
};

export class BaseKeyFlagsRepository {
  private readonly features: FeatureRecord[] = [
    {
      id: 1,
      key: "ai_chat",
      displayName: "AI Assistant",
      releasedTo: "premium",
      updatedAt: new Date()
    },
    {
      id: 2,
      key: "hd_video",
      displayName: "High Def Stream",
      releasedTo: "all",
      updatedAt: new Date()
    }
  ];

  private readonly usageLogs: UsageLogRecord[] = [];

  getAllFeatures(): BaseKeyFeature[] {
    return this.features.map((feature) => this.toFeatureEntity(feature));
  }

  getFeatureByKey(key: string): BaseKeyFeature | undefined {
    const feature = this.features.find((item) => item.key === key);
    return feature ? this.toFeatureEntity(feature) : undefined;
  }

  createFeature(key: string, displayName: string, releasedTo: ReleaseTarget): BaseKeyFeature {
    const nextId = this.features.length + 1;
    const record: FeatureRecord = {
      id: nextId,
      key,
      displayName,
      releasedTo,
      updatedAt: new Date()
    };

    this.features.push(record);
    return this.toFeatureEntity(record);
  }

  updateReleaseTarget(key: string, releasedTo: ReleaseTarget): BaseKeyFeature | undefined {
    const feature = this.features.find((item) => item.key === key);

    if (!feature) {
      return undefined;
    }

    feature.releasedTo = releasedTo;
    feature.updatedAt = new Date();
    return this.toFeatureEntity(feature);
  }

  createUsageLog(featureKey: string, userTier: UserTier, success = true): FeatureUsageLog {
    const nextId = this.usageLogs.length + 1;
    const record: UsageLogRecord = {
      id: nextId,
      featureKey,
      userTier,
      success,
      createdAt: new Date()
    };

    this.usageLogs.push(record);
    return this.toUsageLogEntity(record);
  }

  getAllUsageLogs(): FeatureUsageLog[] {
    return this.usageLogs.map((log) => this.toUsageLogEntity(log));
  }

  private toFeatureEntity(feature: FeatureRecord): BaseKeyFeature {
    return {
      id: feature.id,
      key: feature.key,
      displayName: feature.displayName,
      releasedTo: feature.releasedTo,
      updatedAt: feature.updatedAt.toISOString()
    };
  }

  private toUsageLogEntity(log: UsageLogRecord): FeatureUsageLog {
    return {
      id: log.id,
      featureKey: log.featureKey,
      userTier: log.userTier,
      success: log.success,
      createdAt: log.createdAt.toISOString()
    };
  }
}
