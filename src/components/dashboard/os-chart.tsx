"use client";

import { useMemo, useState } from "react";
import { PieChart } from "@/components/charts/pie-chart";
import PieSlice from "@/components/charts/pie-slice";
import PieCenter from "@/components/charts/pie-center";
import {
  ChartLegendHoverProvider,
  useChartLegendHover,
} from "@/components/charts/chart-legend-hover";

interface OSChartProps {
  data: { name: string; count: number }[];
}

const DONUT_PALETTE = [
  "oklch(0.68 0.3 35)",     // vermillion (accent)
  "oklch(0.65 0.28 230)",   // blue
  "oklch(0.66 0.24 170)",   // teal
  "oklch(0.67 0.28 55)",    // gold
  "oklch(0.63 0.28 290)",   // purple
];

function OSLegend({ data }: { data: { label: string; value: number; color: string }[] }) {
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

export function OSChart({ data }: OSChartProps) {
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
        <p className="label-mono text-muted-foreground">Operating Systems</p>
        <p className="text-sm text-muted-foreground mt-3 font-[450]">No data yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <p className="label-mono text-muted-foreground mb-6">Operating Systems</p>
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
            <PieCenter defaultLabel="Total" />
          </PieChart>
          <OSLegend data={chartData} />
        </ChartLegendHoverProvider>
      </div>
    </div>
  );
}
