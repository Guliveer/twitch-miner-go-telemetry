"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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

export function OSChart({ data }: OSChartProps) {
  const total = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);

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
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <text
                x="50%" y="50%"
                textAnchor="middle" dominantBaseline="middle"
                fill="var(--foreground)"
                fontSize={24} fontWeight={700}
                fontFamily="var(--font-mono)"
              >
                {total.toLocaleString()}
              </text>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={DONUT_PALETTE[index % DONUT_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                  fontFamily: "Inter Tight, system-ui, sans-serif",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 2 }}
                itemStyle={{ color: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ color: "var(--foreground)", fontSize: 12, fontFamily: "Inter Tight, system-ui, sans-serif", paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
    </div>
  );
}
