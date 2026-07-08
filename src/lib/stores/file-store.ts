import { promises as fs } from "node:fs";
import path from "node:path";
import type { DashboardStats, DailyCount, HeartbeatPayload, IStore, LabelEntry, StoredInstance, UptimeStat, VersionStat } from "../types";
import { getPruneThreshold } from "../types";

function getDataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
}

let dataDir: string | null = null;

async function resolveDataDir(): Promise<string> {
  if (dataDir) return dataDir;

  const dir = getDataDir();
  try {
    await fs.mkdir(dir, { recursive: true });
    dataDir = dir;
  } catch {
    const fallback = path.join("/tmp", ".data");
    await fs.mkdir(fallback, { recursive: true });
    dataDir = fallback;
  }
  return dataDir;
}

async function getDataPath(): Promise<string> {
  const dir = await resolveDataDir();
  return path.join(dir, "instances.json");
}

async function getLabelsPath(): Promise<string> {
  const dir = await resolveDataDir();
  return path.join(dir, "labels.json");
}

export class FileStore implements IStore {
  private instances = new Map<string, StoredInstance>();
  private labels = new Map<string, string>();
  private loaded = false;
  private writeScheduled = false;
  private labelsWriteScheduled = false;

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;

    const dataPath = await getDataPath();
    const raw = await fs.readFile(dataPath, "utf-8").catch(() => undefined);
    if (raw) {
      const parsed: StoredInstance[] = JSON.parse(raw);
      for (const inst of parsed) {
        this.instances.set(inst.instanceId, inst);
      }
    }

    const labelsPath = await getLabelsPath();
    const labelsRaw = await fs.readFile(labelsPath, "utf-8").catch(() => undefined);
    if (labelsRaw) {
      const parsed: LabelEntry[] = JSON.parse(labelsRaw);
      for (const entry of parsed) {
        this.labels.set(entry.instanceId, entry.label);
      }
    }
  }

  private scheduleWrite(): void {
    if (this.writeScheduled) return;
    this.writeScheduled = true;

    setTimeout(async () => {
      try {
        await this.flush();
      } finally {
        this.writeScheduled = false;
      }
    }, 1_000).unref();
  }

  private scheduleLabelsWrite(): void {
    if (this.labelsWriteScheduled) return;
    this.labelsWriteScheduled = true;

    setTimeout(async () => {
      try {
        await this.flushLabels();
      } finally {
        this.labelsWriteScheduled = false;
      }
    }, 500).unref();
  }

  async flush(): Promise<void> {
    const dataPath = await getDataPath();
    const data = JSON.stringify([...this.instances.values()], null, 2);
    const tmp = dataPath + ".tmp";
    await fs.writeFile(tmp, data, "utf-8");
    await fs.rename(tmp, dataPath);
  }

  async flushLabels(): Promise<void> {
    const labelsPath = await getLabelsPath();
    const entries: LabelEntry[] = [...this.labels.entries()].map(([instanceId, label]) => ({
      instanceId,
      label,
    }));
    const data = JSON.stringify(entries, null, 2);
    const tmp = labelsPath + ".tmp";
    await fs.writeFile(tmp, data, "utf-8");
    await fs.rename(tmp, labelsPath);
  }

  async recordHeartbeat(payload: HeartbeatPayload): Promise<void> {
    await this.ensureLoaded();

    const existing = this.instances.get(payload.instance_id);
    const now = Date.now();

    if (existing) {
      existing.lastSeen = now;
      existing.version = payload.version;
      if (payload.os) existing.os = payload.os;
      if (payload.arch) existing.arch = payload.arch;
      if (payload.deployment) existing.deployment = payload.deployment;
      if (payload.uptime_seconds != null) existing.uptimeSeconds = payload.uptime_seconds;
      if (payload.running_accounts != null) existing.runningAccounts = payload.running_accounts;
    } else {
      this.instances.set(payload.instance_id, {
        instanceId: payload.instance_id,
        version: payload.version,
        os: payload.os ?? null,
        arch: payload.arch ?? null,
        deployment: payload.deployment ?? null,
        firstSeen: now,
        lastSeen: now,
        runningAccounts: payload.running_accounts ?? 0,
        uptimeSeconds: payload.uptime_seconds ?? null,
        label: this.labels.get(payload.instance_id) ?? "",
        ignored: false,
      });
    }

    this.scheduleWrite();

    if (Math.random() < 0.01) {
      const pruned = await this.prune();
      if (pruned > 0) {
        console.log(`[telemetry] Pruned ${pruned} stale instance(s) from file store`);
      }
    }
  }

  async getStats(): Promise<DashboardStats> {
    await this.ensureLoaded();

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const sevenDays = 7 * oneDay;

    const instances = [...this.instances.values()];
    const tracked = instances.filter((i) => !i.ignored);
    const total = tracked.length;
    const active1h = tracked.filter((i) => now - i.lastSeen < oneHour).length;
    const active24h = tracked.filter((i) => now - i.lastSeen < oneDay).length;
    const active7d = tracked.filter((i) => now - i.lastSeen < sevenDays).length;

    const versionCounts = new Map<string, number>();
    for (const inst of tracked) {
      versionCounts.set(inst.version, (versionCounts.get(inst.version) ?? 0) + 1);
    }
    const versionDistribution: VersionStat[] = [...versionCounts.entries()]
      .map(([version, count]) => ({
        version,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const osCounts = new Map<string, number>();
    for (const inst of tracked) {
      const key = inst.os ?? "unknown";
      osCounts.set(key, (osCounts.get(key) ?? 0) + 1);
    }
    const osDistribution = [...osCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const depCounts = new Map<string, number>();
    for (const inst of tracked) {
      const key = inst.deployment ?? "unknown";
      depCounts.set(key, (depCounts.get(key) ?? 0) + 1);
    }
    const deploymentDistribution = [...depCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const firstSeenBuckets = new Map<string, number>();
    for (const inst of tracked) {
      const date = new Date(inst.firstSeen).toISOString().slice(0, 10);
      firstSeenBuckets.set(date, (firstSeenBuckets.get(date) ?? 0) + 1);
    }
    const firstSeenDistribution: DailyCount[] = [...firstSeenBuckets.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const uptimeByVersionMap = new Map<string, { sum: number; count: number }>();
    for (const inst of tracked) {
      if (inst.uptimeSeconds == null) continue;
      const entry = uptimeByVersionMap.get(inst.version) ?? { sum: 0, count: 0 };
      entry.sum += inst.uptimeSeconds;
      entry.count += 1;
      uptimeByVersionMap.set(inst.version, entry);
    }
    const uptimeByVersion: UptimeStat[] = [...uptimeByVersionMap.entries()]
      .map(([version, { sum, count }]) => ({
        version,
        avgUptimeSeconds: Math.round(sum / count),
        count,
      }))
      .sort((a, b) => b.avgUptimeSeconds - a.avgUptimeSeconds);

    const totalRunningAccounts = tracked.reduce((s, i) => s + i.runningAccounts, 0);

    const accountsDistribution = tracked
      .map((inst) => ({
        instanceId: inst.instanceId,
        running: inst.runningAccounts,
        label: inst.label,
      }))
      .sort((a, b) => b.running - a.running)
      .slice(0, 30);

    // All instances sorted: non-ignored first (by lastSeen desc), then ignored (by lastSeen desc)
    const recentInstances = [...instances]
      .map((inst) => ({
        ...inst,
        runningAccounts: inst.runningAccounts ?? 0,
      }))
      .sort((a, b) => {
        if (a.ignored !== b.ignored) return a.ignored ? 1 : -1;
        return b.lastSeen - a.lastSeen;
      })
      .slice(0, 50);

    return {
      totalInstances: total,
      active1h,
      active24h,
      active7d,
      totalRunningAccounts,
      versionDistribution,
      osDistribution,
      deploymentDistribution,
      firstSeenDistribution,
      uptimeByVersion,
      accountsDistribution,
      recentInstances,
    };
  }

  async getInstances(limit = 100, offset = 0): Promise<{ instances: StoredInstance[]; total: number }> {
    await this.ensureLoaded();

    const all = [...this.instances.values()]
      .map((inst) => ({
        ...inst,
        runningAccounts: inst.runningAccounts ?? 0,
        label: this.labels.get(inst.instanceId) ?? inst.label,
      }))
      .sort((a, b) => {
        if (a.ignored !== b.ignored) return a.ignored ? 1 : -1;
        return b.lastSeen - a.lastSeen;
      });

    return {
      total: all.length,
      instances: all.slice(offset, offset + limit),
    };
  }

  async getInstanceLabels(): Promise<LabelEntry[]> {
    await this.ensureLoaded();
    return [...this.labels.entries()].map(([instanceId, label]) => ({ instanceId, label }));
  }

  async setInstanceLabel(instanceId: string, label: string): Promise<void> {
    await this.ensureLoaded();
    this.labels.set(instanceId, label);

    const inst = this.instances.get(instanceId);
    if (inst) {
      inst.label = label;
      this.scheduleWrite();
    }

    this.scheduleLabelsWrite();
  }

  async setInstanceIgnored(instanceId: string, ignored: boolean): Promise<void> {
    await this.ensureLoaded();

    const inst = this.instances.get(instanceId);
    if (!inst) return;

    inst.ignored = ignored;
    this.scheduleWrite();
  }

  async prune(): Promise<number> {
    await this.ensureLoaded();

    const threshold = Date.now() - getPruneThreshold();
    const stale: string[] = [];

    for (const [id, inst] of this.instances) {
      if (inst.lastSeen < threshold) {
        stale.push(id);
      }
    }

    for (const id of stale) {
      this.instances.delete(id);
    }

    if (stale.length > 0) this.scheduleWrite();

    return stale.length;
  }
}
