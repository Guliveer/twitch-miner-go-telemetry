"use client";

import { useState, useMemo, useCallback } from "react";
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
import type { DailyCount } from "@/lib/types";

const SERIES_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface AdoptionCurveProps {
  data: Record<string, DailyCount[]>;
  versionDistribution: { version: string; count: number }[];
}

function mergeVersionData(
  data: Record<string, DailyCount[]>,
  topVersions: string[],
): { data: Record<string, unknown>[]; seriesNames: string[] } {
  const allDates = new Set<string>();
  for (const daily of Object.values(data)) {
    for (const entry of daily) allDates.add(entry.date);
  }
  const sortedDates = [...allDates].sort();

  const runningTotals = new Map<string, number>();
  for (const name of topVersions) runningTotals.set(name, 0);

  const chartData = sortedDates.map((date) => {
    const row: Record<string, unknown> = { date: new Date(date) };
    for (const name of topVersions) {
      const daily = data[name];
      const entry = daily?.find((d) => d.date === date);
      if (entry) runningTotals.set(name, (runningTotals.get(name) ?? 0) + entry.count);
      row[name] = runningTotals.get(name) ?? 0;
    }
    return row;
  });

  return { data: chartData, seriesNames: topVersions };
}

function AdoptionLegend({ seriesNames }: { seriesNames: string[] }) {
  const { hoveredIndex, setHoveredIndex } = useChartLegendHover();

  return (
    <div className="flex flex-wrap justify-center gap-4 pt-3">
      {seriesNames.map((name, i) => {
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
              style={{ backgroundColor: SERIES_PALETTE[i % SERIES_PALETTE.length] }}
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

  const topVersions = useMemo(() => {
    return versionDistribution
      .slice(0, SERIES_PALETTE.length)
      .map((v) => v.version);
  }, [versionDistribution]);

  const { data: chartData, seriesNames } = useMemo(() => {
    return mergeVersionData(data, topVersions);
  }, [data, topVersions]);

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
        <p className="label-mono text-muted-foreground">Adoption Curve (New Instances per Version)</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">No data yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between gap-4">
          <p className="label-mono text-muted-foreground">Adoption Curve (New Instances per Version)</p>
          <TimeRangePicker />
        </div>
      </div>
      <ChartLegendHoverProvider hoveredIndex={hoveredIndex} onHoverChange={handleHoverChange}>
        <AreaChart
          data={filteredData}
          xDataKey="date"
          margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
          aspectRatio="3 / 1"
        >
          <Grid horizontal />
          {seriesNames.map((name, i) => (
            <Area
              key={name}
              dataKey={name}
              fill={SERIES_PALETTE[i % SERIES_PALETTE.length]}
              fillOpacity={0.2}
              stroke={SERIES_PALETTE[i % SERIES_PALETTE.length]}
              strokeWidth={1.5}
              dimOpacity={0.2}
              animate
            />
          ))}
          <XAxis />
          <ChartTooltip
            showDatePill={false}
            rows={(point) => {
              return seriesNames
                .filter((v) => (point[v] as number) > 0)
                .map((name, i) => ({
                  label: name,
                  value: (point[name] as number).toLocaleString(),
                  color: SERIES_PALETTE[i % SERIES_PALETTE.length],
                }));
            }}
          />
        </AreaChart>
        {seriesNames.length > 0 && (
          <AdoptionLegend seriesNames={seriesNames} />
        )}
      </ChartLegendHoverProvider>
    </div>
  );
}
