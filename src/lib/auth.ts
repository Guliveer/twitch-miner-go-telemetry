import { cookies } from "next/headers";

const AUTH_COOKIE = "auth_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.DASHBOARD_PASSWORD || "dev-only-insecure";
}

function getCredentials(): { username: string; password: string } {
  return {
    username: process.env.DASHBOARD_USER || "admin",
    password: process.env.DASHBOARD_PASSWORD || "",
  };
}

/**
 * Create an HMAC-signed token for a given username.
 * Works in both Edge (Web Crypto) and Node.js runtimes.
 */
export async function createToken(username: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(username));
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${username}.${hex}`;
}

/**
 * Verify an HMAC-signed token. Returns the username if valid, null otherwise.
 */
export async function verifyToken(token: string): Promise<string | null> {
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const username = token.slice(0, dot);
  const expected = await createToken(username);
  if (token.length !== expected.length) return null;

  // Constant-time compare
  const tokenBuf = new TextEncoder().encode(token);
  const expectedBuf = new TextEncoder().encode(expected);
  if (tokenBuf.length !== expectedBuf.length) return null;

  let diff = 0;
  for (let i = 0; i < tokenBuf.length; i++) {
    diff |= tokenBuf[i] ^ expectedBuf[i];
  }
  return diff === 0 ? username : null;
}

/**
 * Validate login credentials against env vars.
 */
export function validateCredentials(username: string, password: string): boolean {
  const { username: expectedUser, password: expectedPass } = getCredentials();
  if (!expectedPass) return false; // no password configured — deny all
  return username === expectedUser && password === expectedPass;
}

/**
 * Set the auth cookie on a response.
 */
export function setAuthCookie(response: Response, token: string): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`,
  );
}

/**
 * Clear the auth cookie.
 */
export function clearAuthCookie(response: Response): void {
  response.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

/**
 * Get the auth token from cookie in a middleware-compatible way.
 */
export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${AUTH_COOKIE}=`)) {
      return trimmed.slice(AUTH_COOKIE.length + 1);
    }
  }
  return null;
}
