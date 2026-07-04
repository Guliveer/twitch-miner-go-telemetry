"use client";

import { useState, useMemo } from "react";
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
} from "@phosphor-icons/react";
import type { StoredInstance } from "@/lib/types";

interface InstancesTableProps {
  instances: StoredInstance[];
}

type SortColumn = "instanceId" | "version" | "os" | "deployment" | "lastSeen";

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

const SORT_LABELS: Record<SortColumn, string> = {
  instanceId: "Instance ID",
  version: "Version",
  os: "OS",
  deployment: "Deployment",
  lastSeen: "Last Seen",
};

export function InstancesTable({ instances }: InstancesTableProps) {
  const [search, setSearch] = useState("");
  const [filterVersion, setFilterVersion] = useState("");
  const [filterOs, setFilterOs] = useState("");
  const [filterDeployment, setFilterDeployment] = useState("");
  const [sort, setSort] = useState<SortState>({ column: "lastSeen", direction: "desc" });

  const uniqueVersions = useMemo(
    () => [...new Set(instances.map((i) => i.version))].sort(),
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

  const hasFilters = search || filterVersion || filterOs || filterDeployment;

  const filtered = useMemo(() => {
    let result = instances;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.instanceId.toLowerCase().includes(q));
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
      }
      return sort.direction === "desc" ? -cmp : cmp;
    });

    return result;
  }, [instances, search, filterVersion, filterOs, filterDeployment, sort]);

  function toggleSort(column: SortColumn) {
    setSort((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  function SortHeader({ column, children }: { column: SortColumn; children: React.ReactNode }) {
    const active = sort.column === column;
    return (
      <TableHead
        className="cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors"
        onClick={() => toggleSort(column)}
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
          </CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="relative flex-1 min-w-[160px] max-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search instance ID..."
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

          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setFilterVersion("");
                setFilterOs("");
                setFilterDeployment("");
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
              <SortHeader column="instanceId">Instance ID</SortHeader>
              <SortHeader column="version">Version</SortHeader>
              <SortHeader column="os">OS</SortHeader>
              <SortHeader column="deployment">Deployment</SortHeader>
              <SortHeader column="lastSeen">Last Seen</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  No instances match the current filters
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inst) => (
                <TableRow key={inst.instanceId}>
                  <TableCell className="font-mono text-xs break-all max-w-[200px]">
                    {inst.instanceId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {inst.version}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{inst.os ?? "—"}</TableCell>
                  <TableCell className="text-sm">{inst.deployment ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {timeAgo(inst.lastSeen)}
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
