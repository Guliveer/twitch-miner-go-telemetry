import { NextResponse } from "next/server";
import { createToken, validateCredentials, clearAuthCookie, setAuthCookie } from "@/lib/auth";

type LoginBody = {
  username?: string;
  password?: string;
};

async function parseBody(request: Request): Promise<LoginBody> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      username: (form.get("username") as string) ?? undefined,
      password: (form.get("password") as string) ?? undefined,
    };
  }

  return {};
}

export async function POST(request: Request): Promise<Response> {
  let body: LoginBody;
  try {
    body = await parseBody(request);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "username and password are required" }, { status: 400 });
  }

  if (!validateCredentials(username, password)) {
    const isForm = (request.headers.get("content-type") ?? "").includes("form");
    if (isForm) {
      return NextResponse.redirect(new URL("/login?error=1", request.url));
    }
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createToken(username);
  const redirectUrl = new URL("/", request.url);
  const response = NextResponse.redirect(redirectUrl);
  setAuthCookie(response, token);

  return response;
}

export async function DELETE(_request: Request): Promise<NextResponse<{ ok: boolean }>> {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}
