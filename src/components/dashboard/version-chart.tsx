"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VersionStat } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VersionChartProps {
  data: VersionStat[];
}

type SortMode = "count" | "version";

export function VersionChart({ data }: VersionChartProps) {
  const [sortMode, setSortMode] = useState<SortMode>("version");

  const sortedData = useMemo(() => {
    const sorted = [...data];
    if (sortMode === "count") {
      sorted.sort((a, b) => b.count - a.count);
    } else {
      sorted.sort((a, b) =>
        b.version.localeCompare(a.version, undefined, { numeric: true }),
      );
    }
    return sorted;
  }, [data, sortMode]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Version Distribution</CardTitle>
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
          <CardTitle className="text-sm font-medium">
            Version Distribution
          </CardTitle>
          <div className="flex items-center gap-0.5 border border-input rounded-none text-xs">
            <button
              onClick={() => setSortMode("count")}
              className={cn(
                "px-2 py-1 transition-colors",
                sortMode === "count"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              by count
            </button>
            <button
              onClick={() => setSortMode("version")}
              className={cn(
                "px-2 py-1 transition-colors",
                sortMode === "version"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              by version
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} className="[&_.recharts-text]:fill-foreground [&_.recharts-cartesian-axis-tick-value]:fill-foreground">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--border)"
            />
            <XAxis
              type="number"
              domain={[0, "dataMax"]}
              allowDecimals={false}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
              stroke="var(--border)"
            />
            <YAxis
              type="category"
              dataKey="version"
              width={100}
              tick={{
                fill: "var(--foreground)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
              stroke="var(--border)"
            />
            <Tooltip
              formatter={(value) => [`${value} instances`, "Count"]}
              contentStyle={{
                backgroundColor: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
                borderRadius: 0,
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--chart-1)"
              radius={[0, 3, 3, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
