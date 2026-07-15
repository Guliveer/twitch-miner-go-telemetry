"use client";

import { useTimeRange, TIME_RANGES } from "./time-range-context";
import { cn } from "@/lib/utils";

export function TimeRangePicker() {
  const { range, setRange } = useTimeRange();

  return (
    <div className="flex gap-2">
      {TIME_RANGES.map((r) => (
        <button
          key={r.label}
          onClick={() => setRange(r.label)}
          className={cn(
            "relative text-xs font-medium transition-colors duration-150 py-1",
            range === r.label
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r.label}
          {range === r.label && (
            <span className="absolute -bottom-px left-0 right-0 h-px bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
