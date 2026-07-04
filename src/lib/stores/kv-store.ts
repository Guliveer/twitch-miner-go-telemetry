import { Redis } from "@upstash/redis";
import type { DashboardStats, HeartbeatPayload, IStore, StoredInstance, VersionStat } from "../types";

const kv = Redis.fromEnv();

const KV_PREFIX = "telemetry";

function instanceKey(id: string): string {
  return `${KV_PREFIX}:instance:${id}`;
}

function idsKey(): string {
  return `${KV_PREFIX}:instance-ids`;
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
      };
      await kv.set(instanceKey(payload.instance_id), updated);
    } else {
      const instance: StoredInstance = {
        instanceId: payload.instance_id,
        version: payload.version,
        os: payload.os ?? null,
        arch: payload.arch ?? null,
        deployment: payload.deployment ?? null,
        firstSeen: now,
        lastSeen: now,
      };
      await kv.set(instanceKey(payload.instance_id), instance, { nx: true });

      // Track ID in a set so we can enumerate all instances
      await kv.sadd(idsKey(), payload.instance_id);
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
        versionDistribution: [],
        osDistribution: [],
        deploymentDistribution: [],
        recentInstances: [],
      };
    }

    const keys = ids.map(instanceKey);
    const rawInstances = await kv.mget<StoredInstance[]>(...keys);
    // mget returns (null | StoredInstance)[] — filter out any nulls
    const instances: StoredInstance[] = rawInstances.filter((i): i is StoredInstance => i !== null);

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
    const ids = await kv.smembers(idsKey());
    const total = ids.length;

    const sorted = ids.sort(); // consistent ordering by instance ID
    const page = sorted.slice(offset, offset + limit);
    const keys = page.map(instanceKey);
    const rawInstances = await kv.mget<StoredInstance[]>(...keys);
    const instances = rawInstances.filter((i): i is StoredInstance => i !== null);

    // Sort by lastSeen descending for display
    instances.sort((a, b) => b.lastSeen - a.lastSeen);

    return { total, instances };
  }
}

export function isKVConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL);
}
