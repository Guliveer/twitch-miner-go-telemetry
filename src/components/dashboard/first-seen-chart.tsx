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
import { cn } from "@/lib/utils";
import { TimeRangePicker } from "./time-range-selector";
import { useTimeRange } from "./time-range-context";
import type { DailyCount } from "@/lib/types";

type SplitMode = "total" | "os" | "deployment";

const SPLIT_MODES: { label: string; value: SplitMode }[] = [
  { label: "Total", value: "total" },
  { label: "Platform", value: "os" },
  { label: "Environment", value: "deployment" },
];

const SERIES_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function mergeSplitData(
  series: Record<string, DailyCount[]>,
): { data: Record<string, unknown>[]; seriesNames: string[] } {
  const allDates = new Set<string>();
  for (const daily of Object.values(series)) {
    for (const entry of daily) allDates.add(entry.date);
  }
  const sortedDates = [...allDates].sort();
  const seriesNames = Object.keys(series).sort();

  const runningTotals = new Map<string, number>();
  for (const name of seriesNames) runningTotals.set(name, 0);

  const data: Record<string, unknown>[] = sortedDates.map((date) => {
    const row: Record<string, unknown> = { date: new Date(date) };
    let cumulative = 0;
    for (const name of seriesNames) {
      const daily = series[name];
      const entry = daily?.find((d) => d.date === date);
      if (entry) runningTotals.set(name, (runningTotals.get(name) ?? 0) + entry.count);
      cumulative += runningTotals.get(name) ?? 0;
      row[name] = cumulative;
    }
    return row;
  });

  return { data, seriesNames };
}

function SplitLegend({ topSeries }: { topSeries: string[] }) {
  const { hoveredIndex, setHoveredIndex } = useChartLegendHover();

  return (
    <div className="flex flex-wrap justify-center gap-4 pt-3">
      {topSeries.map((name, i) => {
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

interface FirstSeenChartProps {
  data: DailyCount[];
  dataByOs?: Record<string, DailyCount[]>;
  dataByDeployment?: Record<string, DailyCount[]>;
}

export function FirstSeenChart({ data, dataByOs = {}, dataByDeployment = {} }: FirstSeenChartProps) {
  const { range, getDays } = useTimeRange();
  const [splitMode, setSplitMode] = useState<SplitMode>("total");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalChartData = useMemo(() => {
    let running = 0;
    const enriched = data.map((d) => {
      running += d.count;
      return { date: new Date(d.date), cumulative: running };
    });

    const days = getDays();
    if (days === Infinity) return enriched;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return enriched.filter((d) => d.date.getTime() >= cutoff);
  }, [data, range]);

  const splitSource = splitMode === "os" ? dataByOs : dataByDeployment;

  const { data: splitChartData, seriesNames } = useMemo(() => {
    if (splitMode === "total") return { data: [], seriesNames: [] };

    const { data: merged, seriesNames: names } = mergeSplitData(splitSource);

    const days = getDays();
    if (days === Infinity) return { data: merged, seriesNames: names };
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return {
      data: merged.filter((d) => (d.date as Date).getTime() >= cutoff),
      seriesNames: names,
    };
  }, [splitMode, splitSource, range]);

  const isTotal = splitMode === "total";
  const chartData = isTotal ? totalChartData : splitChartData;
  const topSeries = seriesNames.slice(0, SERIES_PALETTE.length);

  const handleHoverChange = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

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
          <div className="flex items-center gap-4">
            <TimeRangePicker />
            <div className="flex gap-2">
              {SPLIT_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSplitMode(m.value)}
                  className={cn(
                    "relative text-xs font-medium transition-colors duration-150 py-1",
                    splitMode === m.value
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m.label}
                  {splitMode === m.value && (
                    <span className="absolute -bottom-px left-0 right-0 h-px bg-accent" />
                  )}
                </button>
              ))}
            </div>
          </div>
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
          {isTotal ? (
            <Area
              dataKey="cumulative"
              fill="var(--chart-line-primary)"
              fillOpacity={0.35}
              stroke="var(--chart-line-primary)"
              strokeWidth={2}
              animate
            />
          ) : (
            topSeries.map((name, i) => (
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
            ))
          )}
          <XAxis />
          <ChartTooltip
            showDatePill={false}
            rows={(point) => {
              if (isTotal) {
                return [
                  { label: "Total", value: (point.cumulative as number).toLocaleString(), color: "var(--chart-line-primary)" },
                ];
              }
              return topSeries.map((name, i) => {
                const cumulative = (point[name] as number) ?? 0;
                const prev = i > 0 ? ((point[topSeries[i - 1]] as number) ?? 0) : 0;
                const individual = cumulative - prev;
                return {
                  label: name,
                  value: individual.toLocaleString(),
                  color: SERIES_PALETTE[i % SERIES_PALETTE.length],
                };
              });
            }}
          />
        </AreaChart>
        {!isTotal && topSeries.length > 0 && (
          <SplitLegend topSeries={topSeries} />
        )}
      </ChartLegendHoverProvider>
    </div>
  );
}
