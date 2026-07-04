import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { HeartbeatPayload, HeartbeatResponse } from "@/lib/types";

function checkApiKey(request: Request): boolean {
  const expected = process.env.HEARTBEAT_API_KEY;
  if (!expected) return true; // no key configured = allow all in dev
  const provided = request.headers.get("x-api-key");
  return provided === expected;
}

export async function POST(request: Request): Promise<NextResponse<HeartbeatResponse | { error: string }>> {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: HeartbeatPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!payload.instance_id || typeof payload.instance_id !== "string") {
    return NextResponse.json({ error: "instance_id is required and must be a string" }, { status: 400 });
  }
  if (!payload.version || typeof payload.version !== "string") {
    return NextResponse.json({ error: "version is required and must be a string" }, { status: 400 });
  }

  await store.recordHeartbeat(payload);

  return NextResponse.json({ status: "ok", message: "Heartbeat recorded" });
}
