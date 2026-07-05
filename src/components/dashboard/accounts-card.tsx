import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountsCardProps {
  totalRunning: number;
  totalConfigured: number;
  fullCapacityCount: number;
}

export function AccountsCard({
  totalRunning,
  totalConfigured,
  fullCapacityCount,
}: AccountsCardProps) {
  const utilization =
    totalConfigured > 0
      ? ((totalRunning / totalConfigured) * 100).toFixed(1)
      : "0.0";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Account Utilization</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Running</span>
          <span className="text-2xl font-bold tabular-nums">{totalRunning}</span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Configured</span>
          <span className="text-2xl font-bold tabular-nums">{totalConfigured}</span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Utilization</span>
          <span className="text-2xl font-bold tabular-nums">{utilization}%</span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">At capacity</span>
          <span className="text-2xl font-bold tabular-nums">{fullCapacityCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}
