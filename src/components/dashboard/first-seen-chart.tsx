"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const filtered = useMemo(() => {
    const selected = RANGES.find((r) => r.label === range);
    if (!selected || selected.days === Infinity) return data;
    const cutoff = Date.now() - selected.days * 24 * 60 * 60 * 1000;
    return data.filter((d) => new Date(d.date).getTime() >= cutoff);
  }, [data, range]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Instances Created Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Instances Created Over Time</CardTitle>
          <div className="flex gap-0.5">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r.label)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-sm transition-colors",
                  range === r.label
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200} className="[&_.recharts-text]:fill-foreground">
          <LineChart data={filtered} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke="var(--border)"
              tickFormatter={(d: string) => {
                const parts = d.split("-");
                return `${parts[2]}.${parts[1]}`;
              }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10 }}
              stroke="var(--border)"
            />
            <Tooltip
              labelFormatter={(label) => String(label)}
              formatter={(value) => [`${value} instance(s)`, "New"]}
              contentStyle={{
                backgroundColor: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
                borderRadius: 0,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
