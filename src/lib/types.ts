export interface HeartbeatPayload {
  instance_id: string;
  version: string;
  os?: string;
  arch?: string;
  deployment?: string;
  uptime_seconds?: number;
  running_accounts?: number;
}

export interface StoredInstance {
  instanceId: string;
  version: string;
  os: string | null;
  arch: string | null;
  deployment: string | null;
  firstSeen: number;
  lastSeen: number;
  runningAccounts: number;
  uptimeSeconds: number | null;
  label: string;
  ignored: boolean;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface UptimeStat {
  version: string;
  avgUptimeSeconds: number;
  count: number;
}

export interface VersionStat {
  version: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  totalInstances: number;
  active1h: number;
  active24h: number;
  active7d: number;
  totalRunningAccounts: number;
  versionDistribution: VersionStat[];
  osDistribution: { name: string; count: number }[];
  deploymentDistribution: { name: string; count: number }[];
  firstSeenDistribution: DailyCount[];
  uptimeByVersion: UptimeStat[];
  accountsDistribution: { instanceId: string; running: number; label: string }[];
  recentInstances: StoredInstance[];
}

export interface InstancesResponse {
  instances: StoredInstance[];
  total: number;
}

export interface HeartbeatResponse {
  status: "ok";
  message: string;
}

export interface LabelEntry {
  instanceId: string;
  label: string;
}

export interface IStore {
  recordHeartbeat(payload: HeartbeatPayload): Promise<void>;
  getStats(): Promise<DashboardStats>;
  getInstances(limit?: number, offset?: number): Promise<{ instances: StoredInstance[]; total: number }>;
  getInstanceLabels(): Promise<LabelEntry[]>;
  setInstanceLabel(instanceId: string, label: string): Promise<void>;
  setInstanceIgnored(instanceId: string, ignored: boolean): Promise<void>;
  prune(): Promise<number>;
}

export function getPruneThreshold(): number {
  const days = Number(process.env.PRUNE_AFTER_DAYS) || 21;
  return days * 24 * 60 * 60 * 1000;
}
