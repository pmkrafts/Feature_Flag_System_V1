import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/config/env";
import { AppError } from "@/utils/appError";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: String(decoded.sub ?? ""),
      role: typeof decoded.role === "string" ? decoded.role : undefined
    };

    next();
  } catch (_error) {
    throw new AppError("Invalid token", 401);
  }
};
