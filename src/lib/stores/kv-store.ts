import { Redis } from "@upstash/redis";
import type { DashboardStats, DailyCount, HeartbeatPayload, IStore, LabelEntry, StoredInstance, UptimeStat, VersionStat } from "../types";
import { getPruneThreshold, isSemver } from "../types";

function createRedisClient(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

const kv = createRedisClient();

const KV_PREFIX = "telemetry";

function instanceKey(id: string): string {
  return `${KV_PREFIX}:instance:${id}`;
}

function idsKey(): string {
  return `${KV_PREFIX}:instance-ids`;
}

function labelsHashKey(): string {
  return `${KV_PREFIX}:labels`;
}

export class UpstashRedisStore implements IStore {
  async recordHeartbeat(payload: HeartbeatPayload): Promise<void> {
    const now = Date.now();
    const existingRaw = await kv.get<StoredInstance>(instanceKey(payload.instance_id));

    if (existingRaw) {
      const updated: StoredInstance = {
        ...existingRaw,
        lastSeen: now,
        version: payload.version,
        os: payload.os ?? existingRaw.os,
        arch: payload.arch ?? existingRaw.arch,
        deployment: payload.deployment ?? existingRaw.deployment,
        uptimeSeconds: payload.uptime_seconds ?? existingRaw.uptimeSeconds,
        runningAccounts: payload.running_accounts ?? existingRaw.runningAccounts,
      };
      await kv.set(instanceKey(payload.instance_id), updated);
    } else {
      const existingLabel = (await kv.hget<string>(labelsHashKey(), payload.instance_id)) ?? "";
      const instance: StoredInstance = {
        instanceId: payload.instance_id,
        version: payload.version,
        os: payload.os ?? null,
        arch: payload.arch ?? null,
        deployment: payload.deployment ?? null,
        firstSeen: now,
        lastSeen: now,
        runningAccounts: payload.running_accounts ?? 0,
        uptimeSeconds: payload.uptime_seconds ?? null,
        label: existingLabel,
        ignored: false,
      };
      await kv.set(instanceKey(payload.instance_id), instance, { nx: true });

      // Track ID in a set so we can enumerate all instances
      await kv.sadd(idsKey(), payload.instance_id);
    }

    // Probabilistic pruning: ~1% chance per heartbeat to avoid scanning on every call
    if (Math.random() < 0.01) {
      const pruned = await this.prune();
      if (pruned > 0) {
        console.log(`[telemetry] Pruned ${pruned} stale instance(s) from Redis`);
      }
    }
  }

  async getStats(): Promise<DashboardStats> {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const sevenDays = 7 * oneDay;

    // Fetch all instance IDs and their data in parallel
    const ids = await kv.smembers(idsKey());
    if (ids.length === 0) {
      return {
        totalInstances: 0,
        active1h: 0,
        active24h: 0,
        active7d: 0,
        totalRunningAccounts: 0,
        versionDistribution: [],
        osDistribution: [],
        deploymentDistribution: [],
        firstSeenDistribution: [],
        firstSeenByOs: {},
        firstSeenByDeployment: {},
        uptimeByVersion: [],
        accountsDistribution: [],
        recentInstances: [],
      };
    }

    const keys = ids.map(instanceKey);
    const rawInstances = await kv.mget<StoredInstance[]>(...keys);
    // mget returns (null | StoredInstance)[] — filter out any nulls
    const instances: StoredInstance[] = rawInstances
      .filter((i): i is StoredInstance => i !== null)
      .map((i) => ({
        ...i,
        runningAccounts: i.runningAccounts ?? 0,
      }));

    const tracked = instances.filter((i) => !i.ignored);
    const versionFiltered = tracked.filter((i) => isSemver(i.version));
    const total = versionFiltered.length;
    const active1h = versionFiltered.filter((i) => now - i.lastSeen < oneHour).length;
    const active24h = versionFiltered.filter((i) => now - i.lastSeen < oneDay).length;
    const active7d = versionFiltered.filter((i) => now - i.lastSeen < sevenDays).length;

    const versionCounts = new Map<string, number>();
    for (const inst of versionFiltered) {
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
    for (const inst of versionFiltered) {
      const key = inst.os ?? "unknown";
      osCounts.set(key, (osCounts.get(key) ?? 0) + 1);
    }
    const osDistribution = [...osCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const depCounts = new Map<string, number>();
    for (const inst of versionFiltered) {
      const key = inst.deployment ?? "unknown";
      depCounts.set(key, (depCounts.get(key) ?? 0) + 1);
    }
    const deploymentDistribution = [...depCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const allLabels = await kv.hgetall<Record<string, string>>(labelsHashKey());

    const firstSeenBuckets = new Map<string, number>();
    for (const inst of versionFiltered) {
      const date = new Date(inst.firstSeen).toISOString().slice(0, 10);
      firstSeenBuckets.set(date, (firstSeenBuckets.get(date) ?? 0) + 1);
    }
    const firstSeenDistribution: DailyCount[] = [...firstSeenBuckets.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const firstSeenByOs: Record<string, DailyCount[]> = {};
    const firstSeenByDeployment: Record<string, DailyCount[]> = {};
    for (const inst of versionFiltered) {
      const date = new Date(inst.firstSeen).toISOString().slice(0, 10);
      const osKey = inst.os ?? "unknown";
      if (!firstSeenByOs[osKey]) firstSeenByOs[osKey] = [];
      const osBucket = firstSeenByOs[osKey];
      const osExisting = osBucket.find((b) => b.date === date);
      if (osExisting) {
        osExisting.count++;
      } else {
        osBucket.push({ date, count: 1 });
      }

      const depKey = inst.deployment ?? "unknown";
      if (!firstSeenByDeployment[depKey]) firstSeenByDeployment[depKey] = [];
      const depBucket = firstSeenByDeployment[depKey];
      const depExisting = depBucket.find((b) => b.date === date);
      if (depExisting) {
        depExisting.count++;
      } else {
        depBucket.push({ date, count: 1 });
      }
    }
    for (const key of Object.keys(firstSeenByOs)) {
      firstSeenByOs[key].sort((a, b) => a.date.localeCompare(b.date));
    }
    for (const key of Object.keys(firstSeenByDeployment)) {
      firstSeenByDeployment[key].sort((a, b) => a.date.localeCompare(b.date));
    }

    const uptimeByVersionMap = new Map<string, { sum: number; count: number }>();
    for (const inst of versionFiltered) {
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

    const totalRunningAccounts = versionFiltered.reduce((s, i) => s + i.runningAccounts, 0);

    const accountsDistribution = versionFiltered
      .map((inst) => ({
        instanceId: inst.instanceId,
        running: inst.runningAccounts,
        label: inst.label,
      }))
      .sort((a, b) => b.running - a.running)
      .slice(0, 30);

    const recentInstances = [...instances]
      .sort((a, b) => {
        if (a.ignored !== b.ignored) return a.ignored ? 1 : -1;
        return b.lastSeen - a.lastSeen;
      })
      .slice(0, 50);

    if (allLabels) {
      for (const inst of recentInstances) {
        inst.label = allLabels[inst.instanceId] ?? inst.label;
      }
    }

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
      firstSeenByOs,
      firstSeenByDeployment,
      uptimeByVersion,
      accountsDistribution,
      recentInstances,
    };
  }

  async getInstances(limit = 100, offset = 0): Promise<{ instances: StoredInstance[]; total: number }> {
    const ids = await kv.smembers(idsKey());
    const total = ids.length;

    const sorted = ids.sort(); // consistent ordering by instance ID
    const page = sorted.slice(offset, offset + limit);
    const keys = page.map(instanceKey);
    const rawInstances = await kv.mget<StoredInstance[]>(...keys);
    const instances = rawInstances
      .filter((i): i is StoredInstance => i !== null)
      .map((i) => ({
        ...i,
        runningAccounts: i.runningAccounts ?? 0,
      }));

    instances.sort((a, b) => {
      if (a.ignored !== b.ignored) return a.ignored ? 1 : -1;
      return b.lastSeen - a.lastSeen;
    });

    const allLabels = await kv.hgetall<Record<string, string>>(labelsHashKey());
    if (allLabels) {
      for (const inst of instances) {
        inst.label = allLabels[inst.instanceId] ?? inst.label;
      }
    }

    return { total, instances };
  }

  async getInstanceLabels(): Promise<LabelEntry[]> {
    const allLabels = await kv.hgetall<Record<string, string>>(labelsHashKey());
    if (!allLabels) return [];
    return Object.entries(allLabels).map(([instanceId, label]) => ({ instanceId, label }));
  }

  async setInstanceLabel(instanceId: string, label: string): Promise<void> {
    await kv.hset(labelsHashKey(), { [instanceId]: label });
  }

  async setInstanceIgnored(instanceId: string, ignored: boolean): Promise<void> {
    const raw = await kv.get<StoredInstance>(instanceKey(instanceId));
    if (!raw) return;
    raw.ignored = ignored;
    await kv.set(instanceKey(instanceId), raw);
  }

  async prune(): Promise<number> {
    const threshold = Date.now() - getPruneThreshold();
    const ids = await kv.smembers(idsKey());
    const staleIds: string[] = [];

    for (const id of ids) {
      const raw = await kv.get<StoredInstance>(instanceKey(id));
      if (!raw || raw.lastSeen < threshold) {
        staleIds.push(id);
      }
    }

    if (staleIds.length === 0) return 0;

    const pipeline = kv.pipeline();
    for (const id of staleIds) {
      pipeline.del(instanceKey(id));
      pipeline.srem(idsKey(), id);
    }
    await pipeline.exec();

    return staleIds.length;
  }
}

export function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL);
}
