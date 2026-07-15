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
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { StabilityChart } from "@/components/dashboard/stability-chart";
import { AdoptionCurve } from "@/components/dashboard/adoption-curve";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const stats = await store.getStats();

  return (
    <DashboardShell>
      {/* Header subtitle + disclaimer */}
      <div className="flex flex-col gap-2" style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) both" }}>
        <div className="flex items-start gap-3">
          <VersionDisclaimer />
        </div>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-[450] tracking-tight">
          Real-time adoption, version distribution, and deployment insights across the twitch-miner-go network.
        </p>
      </div>

      {/* Stats */}
      <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.08s both" }}>
        <StatsCards
          totalInstances={stats.totalInstances}
          active1h={stats.active1h}
          active24h={stats.active24h}
          active7d={stats.active7d}
          totalRunning={stats.totalRunningAccounts}
        />
      </div>

      {/* First seen chart */}
      <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.16s both" }}>
        <FirstSeenChart
          data={stats.firstSeenDistribution}
          dataByOs={stats.firstSeenByOs}
          dataByDeployment={stats.firstSeenByDeployment}
        />
      </div>

      {/* Version chart */}
      <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.24s both" }}>
        <VersionChart data={stats.versionDistribution} />
      </div>

      {/* Adoption curve — full width */}
      <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.28s both" }}>
        <AdoptionCurve data={stats.newInstanceByVersion} versionDistribution={stats.versionDistribution} />
      </div>

      {/* Version history over time */}
      <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.32s both" }}>
        <VersionHistoryChart />
      </div>

      {/* OS + Arch + Deployment */}
      <div className="grid gap-8 md:grid-cols-3" style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.4s both" }}>
        <OSChart data={stats.osDistribution} />
        <ArchChart data={stats.archDistribution} />
        <DeploymentChart data={stats.deploymentDistribution} />
      </div>

      {/* Activity heatmap */}
      <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.48s both" }}>
        <ActivityHeatmap data={stats.activityHeatmap} />
      </div>

      {/* Stability */}
      <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.56s both" }}>
        <StabilityChart data={stats.uptimeByVersion} />
      </div>

      {/* Instances table */}
      <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.64s both" }}>
        <InstancesTable instances={stats.recentInstances} />
      </div>
    </DashboardShell>
  );
}
