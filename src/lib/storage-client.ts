import type { StorageInfo } from "@/lib/types";

let storageInfoPromise: Promise<StorageInfo> | null = null;
const candidatesPromises = new Map<number, Promise<number>>();

function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().then(
      (data: { error?: string }) => {
        throw new Error(data.error ?? `Request failed with status ${res.status}`);
      },
      () => {
        throw new Error(`Request failed with status ${res.status}`);
      }
    );
  }
  return res.json();
}

/** Fetches `/api/storage` once per page load; subsequent calls reuse the result. */
export function fetchStorageInfoCached(): Promise<StorageInfo> {
  if (!storageInfoPromise) {
    storageInfoPromise = fetch("/api/storage")
      .then(parseJson<{ storage: StorageInfo }>)
      .then((data) => data.storage);
  }
  return storageInfoPromise;
}

/** Fetches the inactive-instance preview once per `days` value; subsequent calls reuse the result. */
export function fetchCandidatesCached(days: number): Promise<number> {
  let promise = candidatesPromises.get(days);
  if (!promise) {
    promise = fetch(`/api/storage/prune?days=${days}`)
      .then(parseJson<{ candidates: number }>)
      .then((data) => data.candidates);
    candidatesPromises.set(days, promise);
  }
  return promise;
}

/** Drops cached results so the next fetch hits the server again (after a mutation). */
export function invalidateStorageCache(): void {
  storageInfoPromise = null;
  candidatesPromises.clear();
}

/** Permanently deletes a single instance (with its version history) by id. */
export async function deleteInstance(instanceId: string): Promise<void> {
  const res = await fetch(`/api/instances/${encodeURIComponent(instanceId)}`, {
    method: "DELETE",
  });
  await parseJson<{ ok: boolean }>(res);
}
