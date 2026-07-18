"use client";

import { useState, useMemo, useCallback } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import {
  ChartLegendHoverProvider,
  useChartLegendHover,
} from "@/components/charts/chart-legend-hover";
import { TimeRangePicker } from "./time-range-selector";
import { useTimeRange } from "./time-range-context";
import type { DailyCount } from "@/lib/types";
import {
  majorMinorKey,
  minorVersionColor,
  groupByMinor,
  getMinorGroups,
  CHART_PALETTE,
} from "@/lib/version-colors";

interface AdoptionCurveProps {
  data: Record<string, DailyCount[]>;
  versionDistribution: { version: string; count: number }[];
}

function mergeVersionDataByPatch(
  data: Record<string, DailyCount[]>,
  minorGroups: Map<string, string[]>,
): { data: Record<string, unknown>[]; patchNames: string[] } {
  const allDates = new Set<string>();
  for (const daily of Object.values(data)) {
    for (const entry of daily) allDates.add(entry.date);
  }
  const sortedDates = [...allDates].sort();

  const patchNames: string[] = [];
  for (const versions of minorGroups.values()) {
    for (const v of versions) patchNames.push(v);
  }

  const runningTotals = new Map<string, number>();
  for (const name of patchNames) runningTotals.set(name, 0);

  const chartData = sortedDates.map((date) => {
    const row: Record<string, unknown> = { date: new Date(date) };
    for (const name of patchNames) {
      const daily = data[name];
      const entry = daily?.find((d) => d.date === date);
      if (entry) runningTotals.set(name, (runningTotals.get(name) ?? 0) + entry.count);
      row[name] = runningTotals.get(name) ?? 0;
    }
    return row;
  });

  return { data: chartData, patchNames };
}

function AdoptionLegend({ minorGroups }: { minorGroups: Map<string, string[]> }) {
  const { hoveredIndex, setHoveredIndex } = useChartLegendHover();
  const names = useMemo(() => [...minorGroups.keys()], [minorGroups]);

  return (
    <div className="flex flex-wrap justify-center gap-4 pt-3">
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

export function AdoptionCurve({ data, versionDistribution }: AdoptionCurveProps) {
  const { range, getDays } = useTimeRange();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const allVersions = useMemo(() => versionDistribution.map((v) => v.version), [versionDistribution]);

  const minorGroups = useMemo(() => {
    const groups = groupByMinor(allVersions);
    const sorted = getMinorGroups(allVersions);
    const topGroups = sorted.slice(0, CHART_PALETTE.length);
    const filtered = new Map<string, string[]>();
    for (const key of topGroups) {
      const vals = groups.get(key);
      if (vals) filtered.set(key, vals);
    }
    return filtered;
  }, [allVersions]);

  const minorGroupIndex = useMemo(() => {
    const map = new Map<string, number>();
    let i = 0;
    for (const name of minorGroups.keys()) {
      map.set(name, i);
      i++;
    }
    return map;
  }, [minorGroups]);

  const { data: chartData, patchNames } = useMemo(() => {
    return mergeVersionDataByPatch(data, minorGroups);
  }, [data, minorGroups]);

  const filteredData = useMemo(() => {
    const days = getDays();
    if (days === Infinity) return chartData;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return chartData.filter((d) => (d.date as Date).getTime() >= cutoff);
  }, [chartData, getDays]);

  const handleHoverChange = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  if (Object.keys(data).length === 0) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Adoption Curve</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">No data yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <p className="label-mono text-muted-foreground">Adoption Curve</p>
          <TimeRangePicker />
        </div>
      </div>
      <ChartLegendHoverProvider hoveredIndex={hoveredIndex} onHoverChange={handleHoverChange}>
        <AreaChart
          data={filteredData}
          xDataKey="date"
          margin={{ top: 16, right: 16, bottom: 0, left: 40 }}
          aspectRatio="3 / 1"
        >
          <Grid horizontal />
          {patchNames.map((name) => (
            <Area
              key={name}
              dataKey={name}
              fill={minorVersionColor(majorMinorKey(name))}
              fillOpacity={0.2}
              stroke={minorVersionColor(majorMinorKey(name))}
              strokeWidth={1.5}
              dimOpacity={0.2}
              legendGroup={minorGroupIndex.get(majorMinorKey(name))}
              animate
            />
          ))}
          <XAxis />
          <YAxis formatTick={(v) => v.toLocaleString()} />
          <ChartTooltip
            showDatePill={false}
            rows={(point) => {
              return patchNames
                .filter((name) => (point[name] as number) > 0)
                .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
                .map((name) => ({
                  label: name,
                  value: (point[name] as number).toLocaleString(),
                  color: minorVersionColor(majorMinorKey(name)),
                }));
            }}
          />
        </AreaChart>
        <AdoptionLegend minorGroups={minorGroups} />
      </ChartLegendHoverProvider>
    </div>
  );
}
