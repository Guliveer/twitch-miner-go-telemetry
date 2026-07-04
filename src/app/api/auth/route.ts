import { NextResponse } from "next/server";
import { createToken, validateCredentials, clearAuthCookie, setAuthCookie } from "@/lib/auth";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request): Promise<NextResponse<{ ok: boolean } | { error: string }>> {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "username and password are required" }, { status: 400 });
  }

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createToken(username);
  const response = NextResponse.json({ ok: true });
  setAuthCookie(response, token);

  return response;
}

export async function DELETE(_request: Request): Promise<NextResponse<{ ok: boolean }>> {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}
