import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

const PROTECTED_PATHS = ["/", "/api/stats", "/api/instances"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only check auth for protected paths
  if (!PROTECTED_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(request);
  if (!token) {
    return redirectToLogin(request);
  }

  const user = await verifyToken(token);
  if (!user) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/heartbeat (telemetry collection — no auth)
     * - /login (auth page itself)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico
     */
    "/((?!api/heartbeat|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
