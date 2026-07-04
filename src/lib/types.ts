export interface HeartbeatPayload {
  instance_id: string;
  version: string;
  os?: string;
  arch?: string;
  deployment?: string;
  uptime_seconds?: number;
}

export interface StoredInstance {
  instanceId: string;
  version: string;
  os: string | null;
  arch: string | null;
  deployment: string | null;
  firstSeen: number;
  lastSeen: number;
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
  versionDistribution: VersionStat[];
  osDistribution: { name: string; count: number }[];
  deploymentDistribution: { name: string; count: number }[];
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

export interface IStore {
  recordHeartbeat(payload: HeartbeatPayload): Promise<void>;
  getStats(): Promise<DashboardStats>;
  getInstances(limit?: number, offset?: number): Promise<{ instances: StoredInstance[]; total: number }>;
}
