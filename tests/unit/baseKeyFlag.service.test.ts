import { BaseKeyFlagsRepository } from "@/modules/baseKeyFlags/repository";
import { BaseKeyFlagsService } from "@/modules/baseKeyFlags/service";
import { AppError } from "@/utils/appError";

describe("BaseKeyFlagsService", () => {
  it("returns seeded features", () => {
    const service = new BaseKeyFlagsService(new BaseKeyFlagsRepository());

    const features = service.listFeatures();

    expect(features.length).toBeGreaterThan(0);
    expect(features.some((feature) => feature.key === "ai_chat")).toBe(true);
  });

  it("creates a new feature", () => {
    const service = new BaseKeyFlagsService(new BaseKeyFlagsRepository());

    const created = service.createFeature("beta_home", "Beta Home", "none");

    expect(created.key).toBe("beta_home");
    expect(created.releasedTo).toBe("none");
  });

  it("rejects duplicate feature keys", () => {
    const service = new BaseKeyFlagsService(new BaseKeyFlagsRepository());

    expect(() => service.createFeature("ai_chat", "AI Assistant", "premium")).toThrow(AppError);
  });

  it("evaluates access and tracks usage when allowed", () => {
    const service = new BaseKeyFlagsService(new BaseKeyFlagsRepository());

    const result = service.evaluateAccess("ai_chat", "premium");

    expect(result.allowed).toBe(true);

    const usage = service.getUsageByTier();
    expect(usage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          featureKey: "ai_chat",
          userTier: "premium",
          totalUses: 1
        })
      ])
    );
  });

  it("returns false when user is not eligible", () => {
    const service = new BaseKeyFlagsService(new BaseKeyFlagsRepository());

    const result = service.evaluateAccess("ai_chat", "free");

    expect(result.allowed).toBe(false);
  });
});
