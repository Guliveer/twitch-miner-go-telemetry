"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useChart, useChartStable } from "./chart-context";

export interface BarValueAxisProps {
  numTicks?: number;
  formatTick?: (value: number) => string;
}

interface TickData {
  label: string;
  x: number;
}

function defaultFormat(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

export function BarValueAxis(props: BarValueAxisProps) {
  const { containerRef } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  return <BarValueAxisInner {...props} container={container} />;
}

const BarValueAxisInner = memo(function BarValueAxisInner({
  numTicks = 5,
  formatTick = defaultFormat,
  container,
}: BarValueAxisProps & { container: HTMLDivElement }) {
  const { yScale, margin, innerWidth } = useChart();

  const ticks = useMemo(() => {
    const domain = yScale.domain();
    const [min, max] = domain;
    if (min == null || max == null) return [];

    const tickCount = Math.max(2, numTicks);
    const result: TickData[] = [];

    for (let i = 0; i < tickCount; i++) {
      const t = i / (tickCount - 1);
      const value = min + t * (max - min);
      const x = yScale(value);
      if (x == null) continue;
      result.push({ label: formatTick(value), x });
    }

    return result;
  }, [yScale, numTicks, formatTick]);

  return createPortal(
    <div
      className="pointer-events-none absolute bottom-0"
      style={{
        left: margin.left,
        width: innerWidth,
        height: margin.bottom,
      }}
    >
      {ticks.map((tick) => (
        <div
          key={tick.label}
          className="absolute text-xs"
          style={{
            left: tick.x,
            bottom: 4,
            transform: "translateX(-50%)",
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

BarValueAxis.displayName = "BarValueAxis";

export default BarValueAxis;
