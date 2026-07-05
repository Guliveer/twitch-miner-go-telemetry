import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type IgnoreBody = {
  ignored: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ ok: boolean } | { error: string }>> {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    let body: IgnoreBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    await store.setInstanceIgnored(id, body.ignored);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
