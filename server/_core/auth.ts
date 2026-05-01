import jwt from "jsonwebtoken";
import type { Request } from "express";
import { ENV } from "./env";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";

export interface SessionPayload {
  openId: string;
  name: string;
  email: string | null;
}

/**
 * Extract and verify JWT from request cookies
 */
export async function authenticateRequest(req: Request) {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, ENV.cookieSecret) as SessionPayload;
    
    // Fetch user from database to get full user object
    const user = await db.getUserByOpenId(payload.openId);
    return user || null;
  } catch (error) {
    console.warn("[Auth] Token verification failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Create a session token
 */
export function createSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, ENV.cookieSecret, { expiresIn: "1y" });
}
