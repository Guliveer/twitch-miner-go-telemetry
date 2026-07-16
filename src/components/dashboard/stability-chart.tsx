"use client";

import { useMemo } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
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

export function StabilityChart({ data }: StabilityChartProps) {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.avgUptimeSeconds - a.avgUptimeSeconds)
      .slice(0, 10)
      .map((d) => ({
        name: d.version,
        uptime: Math.round(d.avgUptimeSeconds / 3600),
      }));
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
        margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
        aspectRatio="3 / 1"
      >
        <Grid horizontal={false} />
        <Bar
          dataKey="uptime"
          fill="var(--chart-2)"
          lineCap="round"
          animate
        />
        <ChartTooltip
          rows={(point) => {
            const hours = point.uptime as number;
            return [
              { label: "Avg Uptime", value: formatUptime(hours * 3600), color: "var(--chart-2)" },
            ];
          }}
        />
      </BarChart>
    </div>
  );
}