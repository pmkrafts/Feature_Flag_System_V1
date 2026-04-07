import {
  BaseKeyFeature,
  BaseKeyFlagsRepository,
  FeatureUsageLog
} from "@/modules/baseKeyFlags/repository";
import { BaseKeyFlagsService } from "@/modules/baseKeyFlags/service";
import { AppError } from "@/utils/appError";

const seededFeatures: BaseKeyFeature[] = [
  { id: 1, key: "ai_chat", displayName: "AI Assistant", releasedTo: "premium", updatedAt: new Date().toISOString() },
  { id: 2, key: "hd_video", displayName: "High Def Stream", releasedTo: "all", updatedAt: new Date().toISOString() }
];

const makeRepo = (overrides: Partial<Record<keyof BaseKeyFlagsRepository, jest.Mock>> = {}) =>
  ({
    getAllFeatures: jest.fn<Promise<BaseKeyFeature[]>, []>().mockResolvedValue([...seededFeatures]),
    getFeatureByKey: jest.fn<Promise<BaseKeyFeature | undefined>, [string]>().mockResolvedValue(undefined),
    createFeature: jest.fn<Promise<BaseKeyFeature>, [string, string, "none" | "premium" | "all"]>(),
    updateReleaseTarget: jest.fn<Promise<BaseKeyFeature | undefined>, [string, "none" | "premium" | "all"]>(),
    createUsageLog: jest.fn<Promise<FeatureUsageLog>, [string, "free" | "premium", boolean?]>(),
    getAllUsageLogs: jest.fn<Promise<FeatureUsageLog[]>, []>().mockResolvedValue([]),
    ...overrides
  }) as unknown as BaseKeyFlagsRepository;

describe("BaseKeyFlagsService", () => {
  it("returns seeded features", async () => {
    const service = new BaseKeyFlagsService(makeRepo());

    const features = await service.listFeatures();

    expect(features.length).toBe(2);
    expect(features.some((f) => f.key === "ai_chat")).toBe(true);
  });

  it("creates a new feature", async () => {
    const newFeature: BaseKeyFeature = {
      id: 3,
      key: "beta_home",
      displayName: "Beta Home",
      releasedTo: "none",
      updatedAt: new Date().toISOString()
    };
    const repo = makeRepo({
      createFeature: jest.fn<Promise<BaseKeyFeature>, [string, string, "none" | "premium" | "all"]>().mockResolvedValue(newFeature)
    });
    const service = new BaseKeyFlagsService(repo);

    const created = await service.createFeature("beta_home", "Beta Home", "none");

    expect(created.key).toBe("beta_home");
    expect(created.releasedTo).toBe("none");
  });

  it("rejects duplicate feature keys", async () => {
    const repo = makeRepo({
      getFeatureByKey: jest.fn<Promise<BaseKeyFeature | undefined>, [string]>().mockResolvedValue(seededFeatures[0])
    });
    const service = new BaseKeyFlagsService(repo);

    await expect(service.createFeature("ai_chat", "AI Assistant", "premium")).rejects.toThrow(AppError);
  });

  it("evaluates access as allowed for premium user on premium feature", async () => {
    const usageLog: FeatureUsageLog = {
      id: 1,
      featureKey: "ai_chat",
      userTier: "premium",
      success: true,
      createdAt: new Date().toISOString()
    };
    const repo = makeRepo({
      getFeatureByKey: jest.fn<Promise<BaseKeyFeature | undefined>, [string]>().mockResolvedValue(seededFeatures[0]),
      createUsageLog: jest.fn<Promise<FeatureUsageLog>, [string, "free" | "premium", boolean?]>().mockResolvedValue(usageLog)
    });
    const service = new BaseKeyFlagsService(repo);

    const result = await service.evaluateAccess("ai_chat", "premium");

    expect(result.allowed).toBe(true);
    expect(repo.createUsageLog).toHaveBeenCalledWith("ai_chat", "premium", true);
  });

  it("evaluates access as denied for free user on premium feature", async () => {
    const repo = makeRepo({
      getFeatureByKey: jest.fn<Promise<BaseKeyFeature | undefined>, [string]>().mockResolvedValue(seededFeatures[0])
    });
    const service = new BaseKeyFlagsService(repo);

    const result = await service.evaluateAccess("ai_chat", "free");

    expect(result.allowed).toBe(false);
    expect(repo.createUsageLog).not.toHaveBeenCalled();
  });
});
