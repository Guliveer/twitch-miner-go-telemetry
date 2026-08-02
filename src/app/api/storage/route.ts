import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { StorageInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<{ storage: StorageInfo } | { error: string }>> {
  try {
    const storage = await store.getStorageInfo();
    return NextResponse.json({ storage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
