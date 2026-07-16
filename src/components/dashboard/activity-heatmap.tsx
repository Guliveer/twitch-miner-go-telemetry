"use client";

import { useMemo } from "react";
import type { ActivityHeatmapEntry } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityHeatmapProps {
  data: ActivityHeatmapEntry[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

const INTENSITY_LEVELS = [
  "bg-muted",
  "bg-primary/15",
  "bg-primary/30",
  "bg-primary/55",
  "bg-primary/85",
];

function level(count: number, max: number): number {
  if (max === 0 || count === 0) return 0;
  const rel = count / max;
  if (rel <= 0.25) return 1;
  if (rel <= 0.5) return 2;
  if (rel <= 0.75) return 3;
  return 4;
}

function HeatmapCell({
  count,
  max,
  day,
  hour,
}: {
  count: number;
  max: number;
  day: number;
  hour: number;
}) {
  const lvl = level(count, max);

  return (
    <Tooltip>
      <TooltipTrigger
        className={`w-6 h-6 shrink-0 rounded-none ${INTENSITY_LEVELS[lvl]} transition-colors`}
      />
      <TooltipContent>
        <span className="font-medium">{DAYS[day]}</span>{" "}
        <span className="text-muted-foreground">
          {hour.toString().padStart(2, "0")}:00
        </span>
        <span className="ml-auto font-medium tabular-nums">{count}</span>
        <span className="text-muted-foreground">
          {" "}
          {count === 1 ? "instance" : "instances"}
        </span>
      </TooltipContent>
    </Tooltip>
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
          <div className="flex gap-1">
            <div className="w-8 shrink-0" />
            {HOURS.map((h) => (
              <div key={h} className="w-6 text-center text-[10px] text-muted-foreground shrink-0">
                {h}
              </div>
            ))}
          </div>
          {grid.map((row, day) => (
            <div key={day} className="flex gap-1 items-center">
              <div className="w-8 shrink-0 text-[11px] text-muted-foreground text-right pr-1">
                {DAYS[day]}
              </div>
              {row.map((count, hour) => (
                <HeatmapCell key={hour} count={count} max={maxCount} day={day} hour={hour} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}