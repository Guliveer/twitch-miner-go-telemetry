"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { DailyCount } from "@/lib/types";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "21d", days: 21 },
  { label: "1mo", days: 30 },
  { label: "3mo", days: 90 },
  { label: "6mo", days: 180 },
  { label: "1y", days: 365 },
  { label: "All", days: Infinity },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];

interface FirstSeenChartProps {
  data: DailyCount[];
}

export function FirstSeenChart({ data }: FirstSeenChartProps) {
  const [range, setRange] = useState<RangeLabel>("21d");

  const chartData = useMemo(() => {
    let running = 0;
    const enriched = data.map((d) => {
      running += d.count;
      return { ...d, cumulative: running };
    });

    const selected = RANGES.find((r) => r.label === range);
    if (!selected || selected.days === Infinity) return enriched;
    const cutoff = Date.now() - selected.days * 24 * 60 * 60 * 1000;
    return enriched.filter((d) => new Date(d.date).getTime() >= cutoff);
  }, [data, range]);

  if (data.length === 0) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Total Instances Over Time</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">No data yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between gap-4">
          <p className="label-mono text-muted-foreground">Total Instances Over Time</p>
          <div className="flex gap-2">
            {RANGES.map((r) => (
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
        </div>
      </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.04} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "Inter Tight, system-ui, sans-serif" }}
                axisLine={{ stroke: "currentColor", opacity: 0.04 }}
                tickLine={{ stroke: "currentColor", opacity: 0.04 }}
                tickFormatter={(d: string) => {
                  const parts = d.split("-");
                  return `${parts[2]}.${parts[1]}`;
                }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "Inter Tight, system-ui, sans-serif" }}
                axisLine={{ stroke: "currentColor", opacity: 0.04 }}
                tickLine={{ stroke: "currentColor", opacity: 0.04 }}
              />
              <Tooltip
                labelFormatter={(label) => String(label)}
                formatter={(value) => [`${value}`, "Total"]}
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                  fontFamily: "Inter Tight, system-ui, sans-serif",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 2 }}
                itemStyle={{ color: "var(--muted-foreground)", fontSize: 12 }}
                cursor={{ stroke: "var(--accent)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#areaGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
    </div>
  );
}
