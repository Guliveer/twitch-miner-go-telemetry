import { store } from "@/lib/store";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VersionChart } from "@/components/dashboard/version-chart";
import { OSChart } from "@/components/dashboard/os-chart";
import { DeploymentChart } from "@/components/dashboard/deployment-chart";
import { InstancesTable } from "@/components/dashboard/instances-table";
import { FirstSeenChart } from "@/components/dashboard/first-seen-chart";
import { VersionDisclaimer } from "@/components/dashboard/version-disclaimer";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const stats = await store.getStats();

  return (
    <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 py-10 md:py-14 lg:py-16 flex flex-col gap-8 md:gap-10 lg:gap-12">
      {/* Header */}
      <div className="flex flex-col gap-2" style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) both" }}>
        <div className="flex items-start gap-3">
          <h1 className="heading-xl text-foreground">
            Instance<br className="hidden sm:block" /> Telemetry
          </h1>
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

      {/* OS + Deployment side by side */}
      <div className="grid gap-8 md:grid-cols-2" style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.32s both" }}>
        <OSChart data={stats.osDistribution} />
        <DeploymentChart data={stats.deploymentDistribution} />
      </div>

      {/* Instances table */}
      <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.4s both" }}>
        <InstancesTable instances={stats.recentInstances} />
      </div>
    </div>
  );
}
