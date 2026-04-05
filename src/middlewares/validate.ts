import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { AppError } from "@/utils/appError";

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ");
      throw new AppError(message || "Validation failed", 400);
    }

    req.body = result.data;
    next();
  };
};
