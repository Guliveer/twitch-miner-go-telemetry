"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipContentProps = Record<string, any>;

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: TooltipContentProps & {
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/[0.12] bg-background/80 px-3 py-2 text-xs shadow-xl backdrop-blur-2xl">
      <p className="mb-1 font-medium text-foreground">
        {labelFormatter ? labelFormatter(String(label)) : String(label)}
      </p>
      {payload.map((entry: { color?: string; name?: string; value?: number }, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="inline-block size-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name}: </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatter ? formatter(entry.value ?? 0) : String(entry.value ?? "")}
          </span>
        </div>
      ))}
    </div>
  );
}
