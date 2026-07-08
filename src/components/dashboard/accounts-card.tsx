import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountsCardProps {
  totalRunning: number;
}

export function AccountsCard({
  totalRunning,
}: AccountsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Running Accounts</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-bold tabular-nums">{totalRunning}</span>
        </div>
      </CardContent>
    </Card>
  );
}
