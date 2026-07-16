import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "?id= required" }, { status: 400 });
  }

  const { instances } = await store.getInstances(1000, 0);
  const inst = instances.find((i) => i.instanceId === id);

  if (!inst) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    instanceId: inst.instanceId,
    version: inst.version,
    uptimeSeconds: inst.uptimeSeconds,
    lastSeen: inst.lastSeen,
    runningAccounts: inst.runningAccounts,
  });
}

export async function POST() {
  const { instances } = await store.getInstances(1000, 0);

  const withUptime = instances.filter((i) => i.uptimeSeconds != null).length;
  const total = instances.length;
  const semverOnly = instances.filter((i) => /^\d+\.\d+\.\d+$/.test(i.version)).length;

  return NextResponse.json({
    totalInstances: total,
    semverInstances: semverOnly,
    withUptime,
    recentInstance: instances[0]
      ? {
          version: instances[0].version,
          uptimeSeconds: instances[0].uptimeSeconds,
          lastSeenAgo: Date.now() - instances[0].lastSeen,
        }
      : null,
  });
}
