"use client";

import { useMemo } from "react";
import type { ActivityHeatmapEntry } from "@/lib/types";

interface ActivityHeatmapProps {
  data: ActivityHeatmapEntry[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HeatmapCell({ count, max }: { count: number; max: number }) {
  const intensity = max > 0 ? count / max : 0;

  let bgColor = "var(--muted)";
  if (intensity > 0) {
    if (intensity < 0.25) bgColor = "var(--chart-1)";
    else if (intensity < 0.5) bgColor = "var(--chart-2)";
    else if (intensity < 0.75) bgColor = "var(--chart-3)";
    else bgColor = "var(--chart-4)";
  }

  return (
    <div
      className="aspect-square rounded-sm transition-colors"
      style={{
        backgroundColor: bgColor,
        opacity: intensity > 0 ? 0.3 + intensity * 0.7 : 0.15,
      }}
      title={`${count} instances`}
    />
  );
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { grid, maxCount } = useMemo(() => {
    const grid: number[][] = [];
    let maxCount = 0;

    for (let day = 0; day < 7; day++) {
      const row: number[] = [];
      for (let hour = 0; hour < 24; hour++) {
        const entry = data.find((d) => d.day === day && d.hour === hour);
        const count = entry?.count ?? 0;
        row.push(count);
        if (count > maxCount) maxCount = count;
      }
      grid.push(row);
    }

    return { grid, maxCount };
  }, [data]);

  if (data.length === 0 || maxCount === 0) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Activity Heatmap</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">No data yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <p className="label-mono text-muted-foreground">Activity Heatmap</p>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            <div className="w-10 shrink-0" />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="w-5 text-center text-[9px] text-muted-foreground shrink-0">
                {h}
              </div>
            ))}
          </div>
          {grid.map((row, day) => (
            <div key={day} className="flex gap-0.5">
              <div className="w-10 shrink-0 text-[10px] text-muted-foreground flex items-center">
                {DAYS[day]}
              </div>
              {row.map((count, hour) => (
                <HeatmapCell key={hour} count={count} max={maxCount} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}