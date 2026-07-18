const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function colorForIndex(i: number): string {
  return CHART_PALETTE[i % CHART_PALETTE.length];
}

function hashIndex(str: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % mod;
}

/** Extract major.minor from any version string (e.g. "v1.24.3" → "1.24") */
export function majorMinorKey(version: string): string {
  const parts = version.replace(/^v/, "").split(".");
  return parts.slice(0, 2).join(".");
}

/** Deterministic color for a major.minor pair from the chart palette */
export function minorVersionColor(minor: string): string {
  return CHART_PALETTE[hashIndex(minor, CHART_PALETTE.length)];
}

/**
 * Compute opacity for a specific patch version within its major.minor group.
 * Newest patch = 1.0, older patches fade toward 0.4.
 */
export function patchOpacity(version: string, allVersionsInGroup: string[]): number {
  if (allVersionsInGroup.length <= 1) return 1;

  const sorted = [...allVersionsInGroup].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const idx = sorted.indexOf(version);
  if (idx === -1) return 1;

  const newest = sorted.length - 1;
  if (newest === 0) return 1;

  // Linear interpolation: newest=1.0, oldest=0.4
  const t = idx / newest;
  return 0.4 + 0.6 * t;
}

/** Parse version string to [major, minor, patch] numbers */
export function parseVersion(version: string): [number, number, number] {
  const parts = version.replace(/^v/, "").split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/** Get all unique major.minor groups from a list of versions, sorted newest-first */
export function getMinorGroups(versions: string[]): string[] {
  const groups = new Set(versions.map(majorMinorKey));
  return [...groups].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

/** Group versions by their major.minor key */
export function groupByMinor(versions: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const v of versions) {
    const key = majorMinorKey(v);
    const list = groups.get(key);
    if (list) {
      list.push(v);
    } else {
      groups.set(key, [v]);
    }
  }
  return groups;
}

export { CHART_PALETTE };
