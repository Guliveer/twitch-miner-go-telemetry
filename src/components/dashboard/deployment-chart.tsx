"use client";

import { useMemo, useState } from "react";
import { PieChart } from "@/components/charts/pie-chart";
import PieSlice from "@/components/charts/pie-slice";
import PieCenter from "@/components/charts/pie-center";
import {
  ChartLegendHoverProvider,
  useChartLegendHover,
} from "@/components/charts/chart-legend-hover";

interface DeploymentChartProps {
  data: { name: string; count: number }[];
}

const DONUT_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function DeploymentLegend({ data }: { data: { label: string; value: number; color: string }[] }) {
  const { hoveredIndex, setHoveredIndex } = useChartLegendHover();

  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {data.map((item, index) => {
        const isFaded = hoveredIndex !== null && hoveredIndex !== index;
        return (
          <button
            key={item.label}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="flex items-center gap-1.5 text-xs transition-colors hover:text-foreground"
            style={{ color: isFaded ? "var(--muted-foreground)" : "var(--foreground)", opacity: isFaded ? 0.4 : 1 }}
          >
            <span
              className="inline-block size-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
            <span className="font-mono font-medium tabular-nums">
              {item.value.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function DeploymentChart({ data }: DeploymentChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(
    () =>
      data.map((d, i) => ({
        label: d.name,
        value: d.count,
        color: DONUT_PALETTE[i % DONUT_PALETTE.length],
      })),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className="border border-border p-6 md:p-8">
        <p className="label-mono text-muted-foreground">Deployment Type</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">No data yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <p className="label-mono text-muted-foreground mb-6">Deployment Type</p>
      <div className="flex flex-col items-center">
        <ChartLegendHoverProvider hoveredIndex={hoveredIndex} onHoverChange={setHoveredIndex}>
          <PieChart
            data={chartData}
            size={250}
            innerRadius={78}
            padAngle={0.035}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
          >
            {chartData.map((_, index) => (
              <PieSlice key={index} index={index} hoverEffect="translate" />
            ))}
            <PieCenter percent />
          </PieChart>
          <DeploymentLegend data={chartData} />
        </ChartLegendHoverProvider>
      </div>
    </div>
  );
}
