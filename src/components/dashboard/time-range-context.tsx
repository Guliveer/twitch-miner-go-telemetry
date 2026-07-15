"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export const TIME_RANGES = [
  { label: "7d", days: 7 },
  { label: "21d", days: 21 },
  { label: "1mo", days: 30 },
  { label: "3mo", days: 90 },
  { label: "6mo", days: 180 },
  { label: "1y", days: 365 },
  { label: "All", days: Infinity },
] as const;

export type RangeLabel = (typeof TIME_RANGES)[number]["label"];

interface TimeRangeContextValue {
  range: RangeLabel;
  setRange: (label: RangeLabel) => void;
  getDays: () => number;
}

const TimeRangeContext = createContext<TimeRangeContextValue | null>(null);

export function useTimeRange() {
  const ctx = useContext(TimeRangeContext);
  if (!ctx) throw new Error("useTimeRange must be used within TimeRangeProvider");
  return ctx;
}

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<RangeLabel>("21d");

  const getDays = () => {
    const found = TIME_RANGES.find((r) => r.label === range);
    return found ? found.days : Infinity;
  };

  return (
    <TimeRangeContext.Provider value={{ range, setRange, getDays }}>
      {children}
    </TimeRangeContext.Provider>
  );
}
