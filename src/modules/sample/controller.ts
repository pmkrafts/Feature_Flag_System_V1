import { Request, Response } from "express";
import { SampleService } from "@/modules/sample/service";
import { sendSuccess } from "@/utils/apiResponse";

export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  getSamples = (_req: Request, res: Response): Response => {
    const data = this.sampleService.listSamples();
    return sendSuccess(res, data);
  };

  addSample = (req: Request, res: Response): Response => {
    const data = this.sampleService.createSample(req.body.name);
    return sendSuccess(res, data, 201);
  };
}
