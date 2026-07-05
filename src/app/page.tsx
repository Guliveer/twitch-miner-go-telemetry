import { store } from "@/lib/store";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VersionChart } from "@/components/dashboard/version-chart";
import { OSChart } from "@/components/dashboard/os-chart";
import { DeploymentChart } from "@/components/dashboard/deployment-chart";
import { InstancesTable } from "@/components/dashboard/instances-table";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const stats = await store.getStats();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">twitch-miner-go Telemetry</h1>
        <p className="text-sm text-muted-foreground">
          Instance adoption and version distribution overview
        </p>
      </div>

      <StatsCards
        totalInstances={stats.totalInstances}
        active1h={stats.active1h}
        active24h={stats.active24h}
        active7d={stats.active7d}
      />

      <VersionChart data={stats.versionDistribution} />

      <div className="grid gap-4 md:grid-cols-2">
        <OSChart data={stats.osDistribution} />
        <DeploymentChart data={stats.deploymentDistribution} />
      </div>

      <InstancesTable instances={stats.recentInstances} />
    </div>
  );
}
