import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

interface DayData {
  date: string;
  versions: Record<string, number>;
}

export async function GET(): Promise<NextResponse> {
  try {
    const entries = await store.getVersionHistory();

    if (entries.length === 0) {
      return NextResponse.json({ days: [], versions: [] });
    }

    const allVersions = new Set<string>();

    const instanceTimelines = new Map<string, { version: string; startTs: number }[]>();
    for (const entry of entries) {
      let timeline = instanceTimelines.get(entry.instanceId);
      if (!timeline) {
        timeline = [];
        instanceTimelines.set(entry.instanceId, timeline);
      }
      timeline.push({ version: entry.version, startTs: entry.lastSeen });
      allVersions.add(entry.version);
    }

    for (const timeline of instanceTimelines.values()) {
      timeline.sort((a, b) => a.startTs - b.startTs);
    }

    const dayMap = new Map<string, Record<string, number>>();

    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);

    for (const timeline of instanceTimelines.values()) {
      for (let i = 0; i < timeline.length; i++) {
        const entry = timeline[i];
        const nextEntry = timeline[i + 1];

        const startDate = new Date(entry.startTs);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = nextEntry
          ? new Date(nextEntry.startTs)
          : today;
        endDate.setUTCHours(23, 59, 59, 999);

        let cursor = new Date(startDate);
        while (cursor <= endDate) {
          const dateStr = cursor.toISOString().split("T")[0];
          let dayData = dayMap.get(dateStr);
          if (!dayData) {
            dayData = {};
            for (const v of allVersions) {
              dayData[v] = 0;
            }
            dayMap.set(dateStr, dayData);
          }
          dayData[entry.version] = (dayData[entry.version] || 0) + 1;
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
      }
    }

    const sortedDays = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    const days: DayData[] = sortedDays.map(([date, versions]) => ({
      date,
      versions,
    }));

    const sortedVersions = Array.from(allVersions).sort();

    return NextResponse.json({ days, versions: sortedVersions });
  } catch (error) {
    console.error("Error fetching version history:", error);
    return NextResponse.json(
      { error: "Failed to fetch version history" },
      { status: 500 }
    );
  }
}