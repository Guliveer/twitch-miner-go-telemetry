"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useChart, useChartStable } from "./chart-context";

export interface YAxisProps {
  numTicks?: number;
  formatTick?: (value: number) => string;
}

function defaultFormat(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

export function YAxis(props: YAxisProps) {
  const { containerRef } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  return <YAxisInner {...props} container={container} />;
}

const YAxisInner = memo(function YAxisInner({
  numTicks = 5,
  formatTick = defaultFormat,
  container,
}: YAxisProps & { container: HTMLDivElement }) {
  const { yScale, margin } = useChart();

  const ticks = useMemo(() => {
    const tickValues = yScale.ticks?.(numTicks) ?? [];
    return tickValues.map((value) => {
      const y = yScale(value);
      return { label: formatTick(value), y };
    }).filter((t) => t.y != null && Number.isFinite(t.y));
  }, [yScale, numTicks, formatTick]);

  return createPortal(
    <div className="pointer-events-none absolute top-0 bottom-0">
      {ticks.map((tick) => (
        <div
          key={tick.label}
          className="absolute text-xs"
          style={{
            top: tick.y + margin.top,
            right: 8,
            transform: "translateY(-50%)",
            color: "var(--chart-label, var(--color-zinc-500))",
            fontSize: 11,
            fontFamily: "Inter Tight, system-ui, sans-serif",
          }}
        >
          {tick.label}
        </div>
      ))}
    </div>,
    container
  );
});

YAxis.displayName = "YAxis";

export default YAxis;
