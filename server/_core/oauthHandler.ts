import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { GitHubOAuthClient } from "./githubOAuth";
import { ENV } from "./env";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME } from "../../shared/const";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  const githubOAuth = new GitHubOAuthClient(
    ENV.githubClientId,
    ENV.githubClientSecret,
    ENV.githubRedirectUri
  );

  // Initiate GitHub OAuth flow
  app.get("/api/oauth/github", (req: Request, res: Response) => {
    const state = GitHubOAuthClient.generateState();
    const authUrl = githubOAuth.getAuthorizationUrl(state);

    // Store state in session for CSRF protection
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: ENV.isProduction,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    console.log("[OAuth] Initiating GitHub OAuth flow");
    res.redirect(authUrl);
  });

  // Handle GitHub OAuth callback
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const storedState = req.cookies.oauth_state;

    console.log("[OAuth] Callback received");

    if (!code) {
      console.error("[OAuth] Missing authorization code");
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // Verify CSRF token
    if (!state || state !== storedState) {
      console.error("[OAuth] State mismatch - possible CSRF attack");
      return res.status(400).json({ error: "Invalid state parameter" });
    }

    try {
      // Exchange code for access token
      console.log("[OAuth] Exchanging code for access token");
      const accessToken = await githubOAuth.exchangeCodeForToken(code);

      // Fetch user info
      console.log("[OAuth] Fetching user info from GitHub");
      const userInfo = await githubOAuth.getUserInfo(accessToken);

      // Upsert user in database
      console.log("[OAuth] Upserting user in database");
      await db.upsertUser({
        openId: userInfo.id.toString(),
        name: userInfo.name || userInfo.login,
        email: userInfo.email,
        loginMethod: "github",
        lastSignedIn: new Date(),
      });

      // Create session token
      console.log("[OAuth] Creating session token");
      const sessionToken = jwt.sign(
        {
          openId: userInfo.id.toString(),
          name: userInfo.name || userInfo.login,
          email: userInfo.email,
        },
        ENV.cookieSecret,
        { expiresIn: "1y" }
      );

      // Set session cookie
      res.cookie(COOKIE_NAME, sessionToken, getSessionCookieOptions(req));

      console.log("[OAuth] OAuth flow completed successfully");

      // Redirect to workspace
      res.redirect("/");
    } catch (error) {
      console.error("[OAuth] Error during callback:", error);
      res.status(500).json({
        error: "OAuth callback failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });
}
