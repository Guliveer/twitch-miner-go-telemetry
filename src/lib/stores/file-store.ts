import { promises as fs } from "node:fs";
import path from "node:path";
import type { DashboardStats, HeartbeatPayload, IStore, StoredInstance, VersionStat } from "../types";

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

export class FileStore implements IStore {
  private instances = new Map<string, StoredInstance>();
  private loaded = false;
  private writeScheduled = false;

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;

    try {
      const dataPath = await getDataPath();
      const raw = await fs.readFile(dataPath, "utf-8");
      const parsed: StoredInstance[] = JSON.parse(raw);
      for (const inst of parsed) {
        this.instances.set(inst.instanceId, inst);
      }
    } catch {
      // File doesn't exist or is corrupt — start fresh
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

  async flush(): Promise<void> {
    const dataPath = await getDataPath();
    const data = JSON.stringify([...this.instances.values()], null, 2);
    const tmp = dataPath + ".tmp";
    await fs.writeFile(tmp, data, "utf-8");
    await fs.rename(tmp, dataPath);
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
    } else {
      this.instances.set(payload.instance_id, {
        instanceId: payload.instance_id,
        version: payload.version,
        os: payload.os ?? null,
        arch: payload.arch ?? null,
        deployment: payload.deployment ?? null,
        firstSeen: now,
        lastSeen: now,
      });
    }

    this.scheduleWrite();
  }

  async getStats(): Promise<DashboardStats> {
    await this.ensureLoaded();

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const sevenDays = 7 * oneDay;

    const instances = [...this.instances.values()];
    const total = instances.length;
    const active1h = instances.filter((i) => now - i.lastSeen < oneHour).length;
    const active24h = instances.filter((i) => now - i.lastSeen < oneDay).length;
    const active7d = instances.filter((i) => now - i.lastSeen < sevenDays).length;

    const versionCounts = new Map<string, number>();
    for (const inst of instances) {
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
    for (const inst of instances) {
      const key = inst.os ?? "unknown";
      osCounts.set(key, (osCounts.get(key) ?? 0) + 1);
    }
    const osDistribution = [...osCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const depCounts = new Map<string, number>();
    for (const inst of instances) {
      const key = inst.deployment ?? "unknown";
      depCounts.set(key, (depCounts.get(key) ?? 0) + 1);
    }
    const deploymentDistribution = [...depCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const recentInstances = [...instances]
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 50);

    return {
      totalInstances: total,
      active1h,
      active24h,
      active7d,
      versionDistribution,
      osDistribution,
      deploymentDistribution,
      recentInstances,
    };
  }

  async getInstances(limit = 100, offset = 0): Promise<{ instances: StoredInstance[]; total: number }> {
    await this.ensureLoaded();

    const all = [...this.instances.values()].sort((a, b) => b.lastSeen - a.lastSeen);
    return {
      total: all.length,
      instances: all.slice(offset, offset + limit),
    };
  }
}
