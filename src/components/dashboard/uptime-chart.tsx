"use client";

import { useMemo } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { BarValueAxis } from "@/components/charts/bar-value-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import {
  majorMinorKey,
  minorVersionColor,
  parseVersion,
} from "@/lib/version-colors";
import type { UptimeStat } from "@/lib/types";

interface StabilityChartProps {
  data: UptimeStat[];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function formatTickHours(hours: number): string {
  if (hours >= 24) {
    const d = Math.floor(hours / 24);
    const h = Math.round(hours % 24);
    return h > 0 ? `${d}d${h}h` : `${d}d`;
  }
  return `${Math.round(hours)}h`;
}

function compareVersionsDesc(a: string, b: string): number {
  const [aMaj, aMin, aPat] = parseVersion(a);
  const [bMaj, bMin, bPat] = parseVersion(b);
  if (aMaj !== bMaj) return bMaj - aMaj;
  if (aMin !== bMin) return bMin - aMin;
  return bPat - aPat;
}

export function StabilityChart({ data }: StabilityChartProps) {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => compareVersionsDesc(a.version, b.version))
      .slice(0, 10)
      .map((d) => {
        const minor = majorMinorKey(d.version);
        return {
          name: d.version,
          uptime: Math.round(d.avgUptimeSeconds / 3600),
          barColor: minorVersionColor(minor),
        };
      });
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Avg Uptime</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">No data yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <p className="label-mono text-muted-foreground">Avg Uptime</p>
      </div>
      <BarChart
        data={chartData}
        xDataKey="name"
        orientation="horizontal"
        margin={{ top: 8, right: 80, left: 80, bottom: 24 }}
        aspectRatio="3 / 1"
      >
        <Grid horizontal={false} vertical />
        <BarYAxis />
        <BarValueAxis formatTick={formatTickHours} />
        <Bar
          dataKey="uptime"
          fill="var(--chart-1)"
          fillKey="barColor"
          lineCap="round"
          animate
        />
        <ChartTooltip
          rows={(point) => {
            const hours = point.uptime as number;
            const barColor = (point as Record<string, unknown>).barColor as string | undefined;
            return [
              { label: "Avg Uptime", value: formatUptime(hours * 3600), color: barColor ?? "var(--chart-1)" },
            ];
          }}
        />
      </BarChart>
    </div>
  );
}
