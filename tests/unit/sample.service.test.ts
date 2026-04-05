import { SampleRepository } from "@/modules/sample/repository";
import { SampleService } from "@/modules/sample/service";

describe("SampleService", () => {
  it("returns seeded samples", () => {
    const service = new SampleService(new SampleRepository());

    const result = service.listSamples();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
  });

  it("creates a new sample", () => {
    const service = new SampleService(new SampleRepository());

    const created = service.createSample("Gamma");

    expect(created.name).toBe("Gamma");
    expect(created.id).toBeGreaterThan(0);
  });
});
