import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { DashboardStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<DashboardStats | { error: string }>> {
  try {
    const stats = await store.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
