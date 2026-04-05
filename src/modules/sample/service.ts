import { SampleEntity, SampleRepository } from "@/modules/sample/repository";

export class SampleService {
  constructor(private readonly sampleRepository: SampleRepository) {}

  listSamples(): SampleEntity[] {
    return this.sampleRepository.getAll();
  }

  createSample(name: string): SampleEntity {
    return this.sampleRepository.create(name);
  }
}
