"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalInstances: number;
  active1h: number;
  active24h: number;
  active7d: number;
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Card className={cn("flex-1 min-w-[160px]", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export function StatsCards({
  totalInstances,
  active1h,
  active24h,
  active7d,
}: StatsCardsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label="Total Instances" value={totalInstances} />
      <StatCard label="Active (1h)" value={active1h} />
      <StatCard label="Active (24h)" value={active24h} />
      <StatCard label="Active (7d)" value={active7d} />
    </div>
  );
}
