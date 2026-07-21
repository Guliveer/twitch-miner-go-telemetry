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
import { cn } from "@/lib/utils";
import { TimeRangePicker } from "./time-range-selector";
import { useTimeRange } from "./time-range-context";
import {
  colorForIndex,
  majorMinorKey,
  minorVersionColor,
  groupByMinor,
  getMinorGroups,
  CHART_PALETTE,
} from "@/lib/version-colors";
import type { DailyCount } from "@/lib/types";

type SplitMode = "total" | "os" | "deployment" | "version";

const SPLIT_MODES: { label: string; value: SplitMode }[] = [
  { label: "Total", value: "total" },
  { label: "Platform", value: "os" },
  { label: "Environment", value: "deployment" },
  { label: "Version", value: "version" },
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

function mergeVersionData(
  series: Record<string, DailyCount[]>,
  minorGroups: Map<string, string[]>,
): { data: Record<string, unknown>[]; patchNames: string[] } {
  const allDates = new Set<string>();
  for (const daily of Object.values(series)) {
    for (const entry of daily) allDates.add(entry.date);
  }
  const sortedDates = [...allDates].sort();

  const patchNames: string[] = [];
  for (const versions of minorGroups.values()) {
    for (const v of versions) patchNames.push(v);
  }

  const runningTotals = new Map<string, number>();
  for (const name of patchNames) runningTotals.set(name, 0);

  const data = sortedDates.map((date) => {
    const row: Record<string, unknown> = { date: new Date(date) };
    let cumulative = 0;
    for (const name of patchNames) {
      const daily = series[name];
      const entry = daily?.find((d) => d.date === date);
      if (entry) runningTotals.set(name, (runningTotals.get(name) ?? 0) + entry.count);
      cumulative += runningTotals.get(name) ?? 0;
      row[name] = cumulative;
    }
    return row;
  });

  return { data, patchNames };
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
              style={{ backgroundColor: colorForIndex(i) }}
            />
            <span className="text-muted-foreground">{name}</span>
          </button>
        );
      })}
    </div>
  );
}

function VersionLegend({
  minorGroups,
  groupIndex,
}: {
  minorGroups: Map<string, string[]>;
  groupIndex: Map<string, number>;
}) {
  const { hoveredIndex, setHoveredIndex } = useChartLegendHover();
  const names = useMemo(() => [...minorGroups.keys()], [minorGroups]);

  return (
    <div className="flex flex-wrap justify-center gap-4 pt-3">
      {names.map((name) => {
        const idx = groupIndex.get(name) ?? 0;
        const isFaded = hoveredIndex !== null && hoveredIndex !== idx;
        return (
          <button
            key={name}
            onMouseEnter={() => setHoveredIndex(idx)}
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

interface FirstSeenChartProps {
  data: DailyCount[];
  dataByOs?: Record<string, DailyCount[]>;
  dataByDeployment?: Record<string, DailyCount[]>;
  dataByVersion?: Record<string, DailyCount[]>;
  versionDistribution?: { version: string; count: number }[];
}

export function FirstSeenChart({
  data,
  dataByOs = {},
  dataByDeployment = {},
  dataByVersion = {},
  versionDistribution = [],
}: FirstSeenChartProps) {
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
    if (splitMode === "total" || splitMode === "version") return { data: [], seriesNames: [] };

    const { data: merged, seriesNames: names } = mergeSplitData(splitSource);

    const days = getDays();
    if (days === Infinity) return { data: merged, seriesNames: names };
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return {
      data: merged.filter((d) => (d.date as Date).getTime() >= cutoff),
      seriesNames: names,
    };
  }, [splitMode, splitSource, range]);

  const allVersions = useMemo(
    () => versionDistribution.map((v) => v.version),
    [versionDistribution],
  );

  const versionMinorGroups = useMemo(() => {
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

  const versionGroupIndex = useMemo(() => {
    const map = new Map<string, number>();
    let i = 0;
    for (const name of versionMinorGroups.keys()) {
      map.set(name, i);
      i++;
    }
    return map;
  }, [versionMinorGroups]);

  const { data: versionChartData, patchNames } = useMemo(() => {
    if (splitMode !== "version") return { data: [], patchNames: [] };
    return mergeVersionData(dataByVersion, versionMinorGroups);
  }, [splitMode, dataByVersion, versionMinorGroups]);

  const filteredVersionData = useMemo(() => {
    if (splitMode !== "version") return [];
    const days = getDays();
    if (days === Infinity) return versionChartData;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return versionChartData.filter((d) => (d.date as Date).getTime() >= cutoff);
  }, [splitMode, versionChartData, range]);

  const isTotal = splitMode === "total";
  const isVersion = splitMode === "version";
  const chartData = isTotal ? totalChartData : isVersion ? filteredVersionData : splitChartData;
  const topSeries = seriesNames.slice(0, 5);

  const handleHoverChange = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  if (data.length === 0) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Total Instances</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">No data yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <p className="label-mono text-muted-foreground">Total Instances</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
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
          margin={{ top: 16, right: 16, bottom: 0, left: 40 }}
          aspectRatio="3 / 1"
        >
          <Grid horizontal />
          {isTotal && (
            <Area
              dataKey="cumulative"
              fill="var(--chart-line-primary)"
              fillOpacity={0.35}
              stroke="var(--chart-line-primary)"
              strokeWidth={2}
              animate
            />
          )}
          {isVersion &&
            patchNames.map((name) => (
              <Area
                key={name}
                dataKey={name}
                fill={minorVersionColor(majorMinorKey(name))}
                fillOpacity={0.2}
                stroke={minorVersionColor(majorMinorKey(name))}
                strokeWidth={1.5}
                dimOpacity={0.2}
                legendGroup={versionGroupIndex.get(majorMinorKey(name))}
                animate
              />
            ))}
          {!isTotal &&
            !isVersion &&
            topSeries.map((name, i) => (
              <Area
                key={name}
                dataKey={name}
                fill={colorForIndex(i)}
                fillOpacity={0.2}
                stroke={colorForIndex(i)}
                strokeWidth={1.5}
                dimOpacity={0.2}
                animate
              />
            ))}
          <XAxis />
          <YAxis formatTick={(v) => v.toLocaleString()} />
          <ChartTooltip
            showDatePill={false}
            rows={(point) => {
              if (isTotal) {
                return [
                  { label: "Total", value: (point.cumulative as number).toLocaleString(), color: "var(--chart-line-primary)" },
                ];
              }
              if (isVersion) {
                return patchNames
                  .filter((name) => ((point[name] as number) ?? 0) > 0)
                  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
                  .map((name) => {
                    const idx = patchNames.indexOf(name);
                    const cumulative = (point[name] as number) ?? 0;
                    const prev = idx > 0 ? ((point[patchNames[idx - 1]] as number) ?? 0) : 0;
                    return {
                      label: name,
                      value: (cumulative - prev).toLocaleString(),
                      color: minorVersionColor(majorMinorKey(name)),
                    };
                  });
              }
              return topSeries.map((name, i) => {
                const cumulative = (point[name] as number) ?? 0;
                const prev = i > 0 ? ((point[topSeries[i - 1]] as number) ?? 0) : 0;
                const individual = cumulative - prev;
                return {
                  label: name,
                  value: individual.toLocaleString(),
                  color: colorForIndex(i),
                };
              });
            }}
          />
        </AreaChart>
        {!isTotal && !isVersion && topSeries.length > 0 && (
          <SplitLegend topSeries={topSeries} />
        )}
        {isVersion && (
          <VersionLegend minorGroups={versionMinorGroups} groupIndex={versionGroupIndex} />
        )}
      </ChartLegendHoverProvider>
    </div>
  );
}
