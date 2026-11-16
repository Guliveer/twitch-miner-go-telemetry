import { store } from "@/lib/store";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VersionChart } from "@/components/dashboard/version-chart";
import { VersionHistoryChart } from "@/components/dashboard/version-history-chart";
import { OSChart } from "@/components/dashboard/os-chart";
import { ArchChart } from "@/components/dashboard/arch-chart";
import { DeploymentChart } from "@/components/dashboard/deployment-chart";
import { InstancesTable } from "@/components/dashboard/instances-table";
import { FirstSeenChart } from "@/components/dashboard/first-seen-chart";
import { VersionDisclaimer } from "@/components/dashboard/version-disclaimer";
import { StabilityChart } from "@/components/dashboard/uptime-chart";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const stats = await store.getStats();

  return (
    <DashboardShell>
      <DashboardTabs>
        {/* Header subtitle + disclaimer */}
        <div className="enter flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <VersionDisclaimer />
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-[450] tracking-tight">
            Real-time adoption, version distribution, and deployment insights across the twitch-miner-go network.
          </p>
        </div>

      {/* Stats */}
      <div className="enter" data-enter={1}>
        <StatsCards
          totalInstances={stats.totalInstances}
          active1h={stats.active1h}
          active24h={stats.active24h}
          active7d={stats.active7d}
          totalRunning={stats.totalRunningAccounts}
        />
      </div>

      {/* First seen chart */}
      <div className="enter" data-enter={2}>
        <FirstSeenChart
          data={stats.firstSeenDistribution}
          dataByOs={stats.firstSeenByOs}
          dataByDeployment={stats.firstSeenByDeployment}
          dataByVersion={stats.newInstanceByVersion}
          versionDistribution={stats.versionDistribution}
        />
      </div>

      {/* Version chart */}
      <div className="enter" data-enter={3}>
        <VersionChart data={stats.versionDistribution} />
      </div>

      {/* Version history over time */}
      <div className="enter" data-enter={4}>
        <VersionHistoryChart />
      </div>

      {/* OS + Arch + Deployment */}
      <div className="enter grid gap-8 md:grid-cols-3" data-enter={5}>
        <OSChart data={stats.osDistribution} />
        <ArchChart data={stats.archDistribution} />
        <DeploymentChart data={stats.deploymentDistribution} />
      </div>

      {/* Stability */}
      <div className="enter" data-enter={6}>
        <StabilityChart data={stats.uptimeByVersion} />
      </div>

      {/* Instances table */}
      <div className="enter" data-enter={7}>
        <InstancesTable instances={stats.recentInstances} />
      </div>
      </DashboardTabs>
    </DashboardShell>
  );
}
