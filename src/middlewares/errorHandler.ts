import { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/appError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message
      }
    });
  }

  console.error("Unhandled error", err);

  return res.status(500).json({
    success: false,
    error: {
      message: "Internal Server Error"
    }
  });
};
