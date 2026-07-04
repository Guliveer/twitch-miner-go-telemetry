import type { IStore } from "../types";
import { FileStore } from "./file-store";
import { UpstashRedisStore, isKVConfigured } from "./kv-store";

let storeSingleton: IStore | null = null;

export function createStore(): IStore {
  if (storeSingleton) return storeSingleton;

  if (isKVConfigured()) {
    console.log("[telemetry] Using UpstashRedisStore (Redis)");
    storeSingleton = new UpstashRedisStore();
  } else {
    console.log("[telemetry] Using FileStore (local JSON)");
    storeSingleton = new FileStore();
  }

  return storeSingleton;
}

// Reset for testing
export function resetStore(): void {
  storeSingleton = null;
}
