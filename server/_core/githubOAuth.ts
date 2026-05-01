import crypto from "crypto";
import { ENV } from "./env";

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserInfo {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export class GitHubOAuthClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Generate authorization URL for GitHub OAuth
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: "user:email",
      state: state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    const data = (await response.json()) as GitHubTokenResponse;

    if (!data.access_token) {
      throw new Error("No access token in response");
    }

    return data.access_token;
  }

  /**
   * Fetch user info from GitHub using access token
   */
  async getUserInfo(accessToken: string): Promise<GitHubUserInfo> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return (await response.json()) as GitHubUserInfo;
  }

  /**
   * Generate a random state string for CSRF protection
   */
  static generateState(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

/**
 * Initialize GitHub OAuth client
 */
export function initializeGitHubOAuth(): GitHubOAuthClient {
  const clientId = ENV.githubClientId;
  const clientSecret = ENV.githubClientSecret;
  const redirectUri = ENV.githubRedirectUri;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "GitHub OAuth configuration missing: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_REDIRECT_URI required"
    );
  }

  return new GitHubOAuthClient(clientId, clientSecret, redirectUri);
}
