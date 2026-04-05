import { NextFunction, Request, Response } from "express";

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
};
