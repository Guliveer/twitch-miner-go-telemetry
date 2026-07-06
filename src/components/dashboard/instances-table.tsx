"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CaretUpIcon,
  CaretDownIcon,
  MagnifyingGlassIcon,
  XIcon,
  EyeSlashIcon,
  EyeIcon,
  DownloadIcon,
} from "@phosphor-icons/react";
import type { StoredInstance } from "@/lib/types";

interface InstancesTableProps {
  instances: StoredInstance[];
}

function ScrollingText({ text }: { text: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const c = containerRef.current;
    const t = textRef.current;
    if (!c || !t) return;
    const overflow = t.scrollWidth > c.clientWidth;
    setScrolling(overflow);
    if (overflow) setDistance(t.scrollWidth - c.clientWidth);
  }, [text]);

  return (
    <span ref={containerRef} className="block overflow-hidden">
      <span
        ref={textRef}
        className="block whitespace-nowrap"
        style={
          scrolling
            ? { animation: `marquee 8s linear infinite`, "--marquee-dist": `${-distance}px` } as React.CSSProperties
            : undefined
        }
      >
        {text}
      </span>
    </span>
  );
}

function LabelCell({ instance }: { instance: StoredInstance }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(instance.label ?? "");

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/instances/${instance.instanceId}/label`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: value }),
      });
      if (res.ok) router.refresh();
    } catch {
      console.error("Label save failed");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      save();
    } else if (e.key === "Escape") {
      setValue(instance.label ?? "");
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        className="w-full bg-transparent border border-input rounded px-1 py-0.5 text-xs font-mono outline-none focus:border-ring"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        autoFocus
        disabled={saving}
      />
    );
  }

  return (
    <button
      className="text-xs text-left w-full hover:bg-muted/50 rounded px-1 py-0.5 transition-colors max-w-[280px]"
      onClick={() => {
        setValue(instance.label ?? "");
        setEditing(true);
      }}
      title="Click to edit label"
    >
      {value ? (
        <ScrollingText text={value} />
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </button>
  );
}

type SortColumn = "instanceId" | "version" | "os" | "deployment" | "lastSeen" | "firstSeen" | "label" | "accounts";

interface SortState {
  column: SortColumn;
  direction: "asc" | "desc";
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TimeSince({ timestamp }: { timestamp: number }) {
  const [label, setLabel] = useState("—");

  useEffect(() => {
    setLabel(timeAgo(timestamp));
    const id = setInterval(() => setLabel(timeAgo(timestamp)), 30_000);
    return () => clearInterval(id);
  }, [timestamp]);

  return <>{label}</>;
}

function SortHeader({
  column,
  sort,
  onToggle,
  children,
}: {
  column: SortColumn;
  sort: SortState;
  onToggle: (column: SortColumn) => void;
  children: React.ReactNode;
}) {
  const active = sort.column === column;
  return (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors"
      onClick={() => onToggle(column)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <span className="inline-flex flex-col leading-none">
          <CaretUpIcon
            className={`size-3 -mb-0.5 ${
              active && sort.direction === "asc"
                ? "text-foreground"
                : "text-muted-foreground/40"
            }`}
            weight={active && sort.direction === "asc" ? "fill" : "regular"}
          />
          <CaretDownIcon
            className={`size-3 -mt-0.5 ${
              active && sort.direction === "desc"
                ? "text-foreground"
                : "text-muted-foreground/40"
            }`}
            weight={active && sort.direction === "desc" ? "fill" : "regular"}
          />
        </span>
      </span>
    </TableHead>
  );
}

export function InstancesTable({ instances }: InstancesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterVersion, setFilterVersion] = useState("");
  const [filterOs, setFilterOs] = useState("");
  const [filterDeployment, setFilterDeployment] = useState("");
  const [showIgnored, setShowIgnored] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ column: "lastSeen", direction: "desc" });

  const uniqueVersions = useMemo(
    () =>
      [...new Set(instances.map((i) => i.version))].sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true }),
      ),
    [instances],
  );
  const uniqueOs = useMemo(
    () =>
      [...new Set(instances.map((i) => i.os ?? "unknown"))].sort(),
    [instances],
  );
  const uniqueDeployments = useMemo(
    () =>
      [...new Set(instances.map((i) => i.deployment ?? "unknown"))].sort(),
    [instances],
  );

  const hasFilters = search || filterVersion || filterOs || filterDeployment || !showIgnored;

  async function toggleIgnore(instanceId: string, current: boolean) {
    setToggling(instanceId);
    try {
      const res = await fetch(`/api/instances/${instanceId}/ignore`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ignored: !current }),
      });
      if (res.ok) router.refresh();
    } catch {
      console.error("Ignore toggle failed");
    } finally {
      setToggling(null);
    }
  }

  const filtered = useMemo(() => {
    let result = instances;

    if (!showIgnored) {
      result = result.filter((i) => !i.ignored);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.instanceId.toLowerCase().includes(q) ||
          (i.label ?? "").toLowerCase().includes(q),
      );
    }
    if (filterVersion) {
      result = result.filter((i) => i.version === filterVersion);
    }
    if (filterOs) {
      result = result.filter((i) => (i.os ?? "unknown") === filterOs);
    }
    if (filterDeployment) {
      result = result.filter(
        (i) => (i.deployment ?? "unknown") === filterDeployment,
      );
    }

    result = [...result].sort((a, b) => {
      let cmp: number;
      switch (sort.column) {
        case "instanceId":
          cmp = a.instanceId.localeCompare(b.instanceId);
          break;
        case "version":
          cmp = a.version.localeCompare(b.version, undefined, {
            numeric: true,
          });
          break;
        case "os":
          cmp = (a.os ?? "").localeCompare(b.os ?? "");
          break;
        case "deployment":
          cmp = (a.deployment ?? "").localeCompare(b.deployment ?? "");
          break;
        case "lastSeen":
          cmp = a.lastSeen - b.lastSeen;
          break;
        case "firstSeen":
          cmp = a.firstSeen - b.firstSeen;
          break;
        case "label":
          cmp = (a.label ?? "").localeCompare(b.label ?? "");
          break;
        case "accounts":
          cmp = a.runningAccounts - b.runningAccounts;
          break;
        default:
          cmp = 0;
      }
      return sort.direction === "desc" ? -cmp : cmp;
    });

    return result;
  }, [instances, search, filterVersion, filterOs, filterDeployment, sort, showIgnored]);

  const ignoredCount = useMemo(() => instances.filter((i) => i.ignored).length, [instances]);

  function exportCSV() {
    const headers = ["Instance ID", "Label", "Version", "OS", "Arch", "Deployment", "First Seen", "Last Seen", "Running Accounts", "Total Configs", "Ignored"];
    const rows = instances.map((inst) => [
      inst.instanceId,
      inst.label,
      inst.version,
      inst.os ?? "",
      inst.arch ?? "",
      inst.deployment ?? "",
      new Date(inst.firstSeen).toISOString(),
      new Date(inst.lastSeen).toISOString(),
      String(inst.runningAccounts),
      String(inst.totalConfigs),
      inst.ignored ? "yes" : "no",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instances.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSort(column: SortColumn) {
    setSort((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  if (instances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Instances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-sm font-medium">
            Recent Instances
            <span className="text-muted-foreground font-normal ml-1">
              ({filtered.length}{hasFilters ? ` / ${instances.length}` : ""})
            </span>
            {ignoredCount > 0 && (
              <span className="text-muted-foreground font-normal ml-1">
                | {ignoredCount} ignored
              </span>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <DownloadIcon className="size-3.5" />
            CSV
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="relative flex-1 min-w-[160px] max-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search ID or label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-7"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          <Select value={filterVersion} onValueChange={(v) => setFilterVersion(v ?? "")}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All versions</SelectItem>
              {uniqueVersions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterOs} onValueChange={(v) => setFilterOs(v ?? "")}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="OS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All OS</SelectItem>
              {uniqueOs.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterDeployment} onValueChange={(v) => setFilterDeployment(v ?? "")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Deployment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All deployments</SelectItem>
              {uniqueDeployments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={showIgnored}
              onChange={(e) => setShowIgnored(e.target.checked)}
              className="size-3.5 accent-foreground"
            />
            Show ignored
          </label>

          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setFilterVersion("");
                setFilterOs("");
                setFilterDeployment("");
                setShowIgnored(true);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader column="instanceId" sort={sort} onToggle={toggleSort}>Instance ID</SortHeader>
              <SortHeader column="label" sort={sort} onToggle={toggleSort}>Label</SortHeader>
              <SortHeader column="accounts" sort={sort} onToggle={toggleSort}>Accounts</SortHeader>
              <SortHeader column="version" sort={sort} onToggle={toggleSort}>Version</SortHeader>
              <SortHeader column="os" sort={sort} onToggle={toggleSort}>OS</SortHeader>
              <SortHeader column="deployment" sort={sort} onToggle={toggleSort}>Deployment</SortHeader>
              <SortHeader column="firstSeen" sort={sort} onToggle={toggleSort}>First Seen</SortHeader>
              <SortHeader column="lastSeen" sort={sort} onToggle={toggleSort}>Last Seen</SortHeader>
              <TableHead className="w-10">Ignored</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No instances match the current filters
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inst) => (
                <TableRow key={inst.instanceId} className={inst.ignored ? "opacity-50" : undefined}>
                  <TableCell className="font-mono text-xs break-all max-w-[200px] whitespace-normal">
                    {inst.instanceId}
                  </TableCell>
                  <TableCell>
                    <LabelCell instance={inst} />
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    <span className="tabular-nums">{inst.runningAccounts}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="tabular-nums text-muted-foreground">{inst.totalConfigs}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {inst.version}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{inst.os ?? "—"}</TableCell>
                  <TableCell className="text-sm">{inst.deployment ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    <TimeSince timestamp={inst.firstSeen} />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    <TimeSince timestamp={inst.lastSeen} />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleIgnore(inst.instanceId, inst.ignored)}
                      disabled={toggling === inst.instanceId}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                      title={inst.ignored ? "Include in analytics" : "Ignore in analytics"}
                    >
                      {inst.ignored ? (
                        <EyeSlashIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
