"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { Grid } from "@/components/charts/grid";
import XAxis from "@/components/charts/x-axis";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import {
  ChartLegendHoverProvider,
  useChartLegendHover,
} from "@/components/charts/chart-legend-hover";
import { TimeRangePicker } from "./time-range-selector";
import { useTimeRange } from "./time-range-context";

interface VersionHistoryDay {
  date: string;
  versions: Record<string, number>;
}

interface VersionHistoryResponse {
  days: VersionHistoryDay[];
  versions: string[];
}

const SERIES_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function hashIndex(str: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % mod;
}

function versionColor(version: string): string {
  const parts = version.replace(/^v/, "").split(".");
  const minor = parts.slice(0, 2).join(".");
  return SERIES_PALETTE[hashIndex(minor, SERIES_PALETTE.length)];
}

function getMinorVersion(version: string): string {
  const parts = version.replace(/^v/, "").split(".");
  return parts.slice(0, 2).join(".");
}

function VersionHistoryLegend({ topVersions }: { topVersions: string[] }) {
  const { hoveredIndex, setHoveredIndex } = useChartLegendHover();

  return (
    <div className="flex flex-wrap items-center gap-3 pt-3">
      {topVersions.map((v, i) => {
        const isFaded = hoveredIndex !== null && hoveredIndex !== i;
        return (
          <button
            key={v}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="flex items-center gap-1.5 text-xs transition-opacity"
            style={{ opacity: isFaded ? 0.4 : 1 }}
          >
            <span
              className="inline-block size-2 rounded-full shrink-0"
              style={{ backgroundColor: versionColor(v) }}
            />
            <span className="text-muted-foreground">{getMinorVersion(v)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function VersionHistoryChart() {
  const [data, setData] = useState<VersionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { range, getDays } = useTimeRange();

  useEffect(() => {
    async function fetchVersionHistory() {
      try {
        const res = await fetch("/api/stats/version-history");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchVersionHistory();
  }, []);

  const chartData = useMemo(() => {
    if (!data?.days) return [];

    const days = getDays();
    const all = data.days.map((day) => {
      const total = Object.values(day.versions).reduce((a, b) => a + b, 0);
      if (total === 0) return { date: new Date(day.date) };

      const row: Record<string, unknown> = { date: new Date(day.date) };
      for (const [version, count] of Object.entries(day.versions)) {
        row[version] = Math.round((count / total) * 100);
      }
      return row;
    });

    if (days === Infinity) return all;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return all.filter((d) => (d.date as Date).getTime() >= cutoff);
  }, [data, range, getDays]);

  const topVersions = useMemo(() => {
    if (!data?.versions) return [];

    const latestDay = data.days[data.days.length - 1];
    if (!latestDay) return data.versions.slice(0, 5);

    const sorted = [...data.versions].sort(
      (a, b) => (latestDay.versions[b] || 0) - (latestDay.versions[a] || 0)
    );
    return sorted.slice(0, 5);
  }, [data]);

  const handleHoverChange = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  if (loading) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Version Share Over Time</p>
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data || data.days.length === 0) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Version Share Over Time</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">
          {error || "No data yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between gap-4">
          <p className="label-mono text-muted-foreground">Version Share Over Time</p>
          <TimeRangePicker />
        </div>
      </div>
      <ChartLegendHoverProvider hoveredIndex={hoveredIndex} onHoverChange={handleHoverChange}>
        <AreaChart
          data={chartData}
          xDataKey="date"
          margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
          aspectRatio="3 / 1"
        >
          <Grid horizontal />
          {topVersions.map((version) => (
            <Area
              key={version}
              dataKey={version}
              fill={versionColor(version)}
              fillOpacity={0.3}
              stroke={versionColor(version)}
              strokeWidth={1.5}
              dimOpacity={0.2}
              animate
            />
          ))}
          <XAxis />
          <ChartTooltip
            showDatePill={false}
            rows={(point) => {
              return topVersions
                .filter((v) => (point[v] as number) > 0)
                .map((v) => ({
                  label: v,
                  value: `${point[v]}%`,
                  color: versionColor(v),
                }));
            }}
          />
        </AreaChart>
        <VersionHistoryLegend topVersions={topVersions} />
      </ChartLegendHoverProvider>
    </div>
  );
}
