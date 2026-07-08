"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { VersionStat } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VersionChartProps {
  data: VersionStat[];
}

type SortMode = "count" | "version";

// ═══════════════════════════════════════════════════════════════════════════════
// BAR COLORS — DO NOT MODIFY THIS LOGIC
// ═══════════════════════════════════════════════════════════════════════════════
// Each major.minor pair gets a hue via golden angle (137.508°), the same
// formula that distributes sunflower seeds — maximum dispersion for any
// number of versions with minimal collision risk.
//
//   - 1.22.0 and 1.22.1 → same color (hash is "1.22")
//   - 1.22.0 and 1.23.0 → different colors (different hash → different hue)
//   - 1.22.0 and 2.22.0 → different colors
//
// Formula: oklch(68% 0.26 {hue})
//
// WARNING: Do not replace with a hardcoded palette. The golden angle scales
// to arbitrary version count. Changing GOLDEN_ANGLE or hashHue breaks
// all existing color assignments across page loads.
// ═══════════════════════════════════════════════════════════════════════════════
const GOLDEN_ANGLE = 137.508;

function hashHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) * GOLDEN_ANGLE) % 360);
}

function minorVersionColor(minor: string): string {
  return `oklch(68% 0.26 ${hashHue(minor)})`;
}

function getMinorVersion(version: string): string {
  const parts = version.replace(/^v/, "").split(".");
  return parts.slice(0, 2).join(".");
}

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

  const minorVersionColors = useMemo(() => {
    const minors = [...new Set(data.map((d) => getMinorVersion(d.version)))];
    return new Map(minors.map((v) => [v, minorVersionColor(v)]));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Version Distribution</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">No data yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between gap-4">
          <p className="label-mono text-muted-foreground">Version Distribution</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSortMode("count")}
              className={cn(
                "relative text-xs font-medium transition-colors duration-150 py-1",
                sortMode === "count"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              by count
              {sortMode === "count" && (
                <span className="absolute -bottom-px left-0 right-0 h-px bg-accent" />
              )}
            </button>
            <button
              onClick={() => setSortMode("version")}
              className={cn(
                "relative text-xs font-medium transition-colors duration-150 py-1",
                sortMode === "version"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              by version
              {sortMode === "version" && (
                <span className="absolute -bottom-px left-0 right-0 h-px bg-accent" />
              )}
            </button>
          </div>
        </div>
      </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, "dataMax"]}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "Inter Tight, system-ui, sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="version"
                width={100}
                tick={{
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                  fontFamily: "var(--font-mono)",
                }}
                axisLine={{ stroke: "currentColor", opacity: 0.04 }}
                tickLine={{ stroke: "currentColor", opacity: 0.04 }}
              />
              <Tooltip
                formatter={(value) => [`${value} instances`, "Count"]}
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                  fontFamily: "Inter Tight, system-ui, sans-serif",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 2 }}
                itemStyle={{ color: "var(--muted-foreground)", fontSize: 12 }}
                cursor={{ fill: "var(--accent)", opacity: 0.06 }}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={minorVersionColors.get(getMinorVersion(entry.version)) ?? "var(--accent)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
    </div>
  );
}
