"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { Grid } from "@/components/charts/grid";
import XAxis from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import {
  ChartLegendHoverProvider,
  useChartLegendHover,
} from "@/components/charts/chart-legend-hover";
import { TimeRangePicker } from "./time-range-selector";
import { useTimeRange } from "./time-range-context";
import {
  minorVersionColor,
  groupByMinor,
  getMinorGroups,
  CHART_PALETTE,
} from "@/lib/version-colors";

interface VersionHistoryDay {
  date: string;
  versions: Record<string, number>;
}

interface VersionHistoryResponse {
  days: VersionHistoryDay[];
  versions: string[];
}

function VersionHistoryLegend({ minorGroups }: { minorGroups: Map<string, string[]> }) {
  const { hoveredIndex, setHoveredIndex } = useChartLegendHover();
  const names = useMemo(() => [...minorGroups.keys()], [minorGroups]);

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 pt-3">
      {names.map((name, i) => {
        const isFaded = hoveredIndex !== null && hoveredIndex !== i;
        return (
          <button
            key={name}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="flex items-center gap-1.5 text-xs transition-opacity"
            style={{ opacity: isFaded ? 0.4 : 1 }}
          >
            <span
              className="inline-block size-2 rounded-full shrink-0"
              style={{ backgroundColor: minorVersionColor(name) }}
            />
            <span className="text-muted-foreground">{name}</span>
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

  const minorGroups = useMemo(() => {
    if (!data?.versions) return new Map<string, string[]>();
    return groupByMinor(data.versions);
  }, [data]);

  const topMinorGroups = useMemo(() => {
    if (!data?.days || data.days.length === 0) return new Map<string, string[]>();

    const latestDay = data.days[data.days.length - 1];
    const totals = new Map<string, number>();
    for (const [minor, versions] of minorGroups) {
      let sum = 0;
      for (const v of versions) {
        sum += latestDay.versions[v] ?? 0;
      }
      totals.set(minor, sum);
    }

    const sorted = getMinorGroups([...minorGroups.keys()]);
    const sortedByCount = sorted.sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
    const topKeys = sortedByCount.slice(0, CHART_PALETTE.length);

    const filtered = new Map<string, string[]>();
    for (const key of topKeys) {
      const vals = minorGroups.get(key);
      if (vals) filtered.set(key, vals);
    }
    return filtered;
  }, [data, minorGroups]);

  const seriesNames = useMemo(() => [...topMinorGroups.keys()], [topMinorGroups]);

  const chartData = useMemo(() => {
    if (!data?.days) return [];

    const days = getDays();
    const all = data.days.map((day) => {
      const total = Object.values(day.versions).reduce((a, b) => a + b, 0);
      const row: Record<string, unknown> = { date: new Date(day.date) };
      for (const [minor, versions] of topMinorGroups) {
        let countForGroup = 0;
        for (const v of versions) {
          countForGroup += day.versions[v] ?? 0;
        }
        row[minor] = total > 0 ? Math.round((countForGroup / total) * 100) : 0;
      }
      return row;
    });

    if (days === Infinity) return all;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return all.filter((d) => (d.date as Date).getTime() >= cutoff);
  }, [data, range, getDays, topMinorGroups]);

  const handleHoverChange = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  if (loading) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Version Share</p>
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data || data.days.length === 0) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Version Share</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">
          {error || "No data yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <p className="label-mono text-muted-foreground">Version Share</p>
          <TimeRangePicker />
        </div>
      </div>
      <ChartLegendHoverProvider hoveredIndex={hoveredIndex} onHoverChange={handleHoverChange}>
        <AreaChart
          data={chartData}
          xDataKey="date"
          margin={{ top: 16, right: 16, bottom: 0, left: 40 }}
          aspectRatio="3 / 1"
          yScaleDomainMax={100}
        >
          <Grid horizontal />
          {seriesNames.map((name) => (
            <Area
              key={name}
              dataKey={name}
              fill={minorVersionColor(name)}
              fillOpacity={0.25}
              stroke={minorVersionColor(name)}
              strokeWidth={1.5}
              dimOpacity={0.2}
              animate
            />
          ))}
          <XAxis />
          <YAxis formatTick={(v) => `${v}%`} />
          <ChartTooltip
            showDatePill={false}
            rows={(point) => {
              return seriesNames
                .filter((name) => ((point[name] as number) ?? 0) > 0)
                .map((name) => ({
                  label: name,
                  value: `${point[name]}%`,
                  color: minorVersionColor(name),
                }));
            }}
          />
        </AreaChart>
        <VersionHistoryLegend minorGroups={topMinorGroups} />
      </ChartLegendHoverProvider>
    </div>
  );
}
