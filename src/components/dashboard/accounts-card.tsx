import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountsCardProps {
  totalRunning: number;
}

export function AccountsCard({
  totalRunning,
}: AccountsCardProps) {
  return (
    <Card className="flex-1 min-w-[160px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Running Accounts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{totalRunning}</p>
      </CardContent>
    </Card>
  );
}
