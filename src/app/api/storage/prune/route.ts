import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { PrunePreview, PruneResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const MIN_DAYS = 1;
const MAX_DAYS = 3650;

function parseDays(raw: string | null): number | null {
  if (!raw) return null;
  const days = Number(raw);
  if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) return null;
  return days;
}

function invalidDaysResponse(): NextResponse<{ error: string }> {
  return NextResponse.json(
    { error: `days must be an integer between ${MIN_DAYS} and ${MAX_DAYS}` },
    { status: 400 },
  );
}

// Dry run: returns how many instances are inactive for at least `days` days.
export async function GET(request: NextRequest): Promise<NextResponse<PrunePreview | { error: string }>> {
  const days = parseDays(request.nextUrl.searchParams.get("days"));
  if (days === null) return invalidDaysResponse();

  try {
    const candidates = await store.countInactive(days);
    return NextResponse.json({ days, candidates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Executes the manual deletion of inactive instances.
export async function POST(request: NextRequest): Promise<NextResponse<PruneResult | { error: string }>> {
  let days: number | null;
  try {
    const body = await request.json();
    days = parseDays(body?.days == null ? null : String(body.days));
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (days === null) return invalidDaysResponse();

  try {
    const deleted = await store.prune(days);
    const { total } = await store.getInstances(1, 0);
    return NextResponse.json({ days, deleted, remaining: total });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
