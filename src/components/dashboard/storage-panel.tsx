"use client";

import { useEffect, useState } from "react";
import {
  ClockCounterClockwiseIcon,
  DatabaseIcon,
  HardDriveIcon,
  KeyIcon,
  TagIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { StorageInfo } from "@/lib/types";
import { fetchCandidatesCached, fetchStorageInfoCached, invalidateStorageCache, deleteInstance } from "@/lib/storage-client";
import { AnimatedCounter } from "./animated-counter";

const PRUNE_OPTIONS = [14, 30, 60, 90];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface StorageStatCellProps {
  label: string;
  value: number | null;
  icon: React.ElementType;
  accent?: boolean;
  loading?: boolean;
  format?: (n: number) => string;
}

function StorageStatCell({ label, value, icon: Icon, accent, loading, format }: StorageStatCellProps) {
  return (
    <div className="group relative flex-1 min-w-[160px] border border-border p-5 md:p-6 transition-colors duration-150 hover:border-muted-foreground/30">
      <div className="absolute bottom-3 right-3 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors duration-150">
        <Icon size={20} weight="regular" />
      </div>
      <div className="label-mono text-muted-foreground mb-2">{label}</div>
      <div
        className={`text-2xl md:text-3xl font-bold tracking-tight tabular-nums ${
          accent ? "text-foreground" : "text-foreground"
        }`}
      >
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : value === null ? (
          "—"
        ) : (
          <AnimatedCounter value={value} format={format} />
        )}
      </div>
    </div>
  );
}

export function StoragePanel() {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [days, setDays] = useState(30);
  const [candidates, setCandidates] = useState<number | null>(null);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [instanceId, setInstanceId] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingInstance, setDeletingInstance] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStorageInfoCached()
      .then((info) => {
        if (cancelled) return;
        setStorage(info);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load storage info");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCandidatesCached(days)
      .then((count) => {
        if (cancelled) return;
        setCandidates(count);
        setCandidatesLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCandidates(null);
        setCandidatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  async function confirmDelete() {
    setDeleting(true);
    setResult(null);
    try {
      const res = await fetch("/api/storage/prune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Deletion failed");
      setResult(`Deleted ${data.deleted} inactive instance(s). ${data.remaining} remaining.`);
      setDialogOpen(false);
      invalidateStorageCache();
      setLoading(true);
      setCandidatesLoading(true);
      const [info, count] = await Promise.all([fetchStorageInfoCached(), fetchCandidatesCached(days)]);
      setStorage(info);
      setCandidates(count);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deletion failed");
    } finally {
      setDeleting(false);
      setLoading(false);
      setCandidatesLoading(false);
    }
  }

  const deleteDisabled = deleting || candidatesLoading || (candidates !== null && candidates === 0);

  async function confirmDeleteInstance() {
    setDeletingInstance(true);
    setDeleteResult(null);
    setDeleteError(null);
    try {
      await deleteInstance(instanceId.trim());
      setDeleteResult(`Instance ${instanceId.trim()} deleted.`);
      setDeleteDialogOpen(false);
      setInstanceId("");
      invalidateStorageCache();
      setLoading(true);
      setStorage(await fetchStorageInfoCached());
      setLoading(false);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Deletion failed");
      setDeleteDialogOpen(false);
    } finally {
      setDeletingInstance(false);
    }
  }

  const instanceIdTrimmed = instanceId.trim();
  const deleteInstanceDisabled =
    deletingInstance || instanceIdTrimmed.length === 0;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 lg:gap-12">
      {/* Header */}
      <div
        className="flex flex-col gap-2"
        style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) both" }}
      >
        <div className="flex items-start gap-3">
          <span className="label-mono text-muted-foreground">Storage</span>
        </div>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-[450] tracking-tight">
          How much data the telemetry store holds, and manual cleanup of inactive instances.
        </p>
      </div>

      {error && !storage && (
        <div className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Storage usage indicators */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-border"
        style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.08s both" }}
      >
        <StorageStatCell
          label="Data size"
          value={storage ? storage.estimatedBytes : null}
          icon={HardDriveIcon}
          accent
          loading={loading}
          format={formatBytes}
        />
        <StorageStatCell
          label="Instances"
          value={storage ? storage.instanceCount : null}
          icon={DatabaseIcon}
          loading={loading}
        />
        <StorageStatCell
          label="Keys"
          value={storage ? storage.totalKeys : null}
          icon={KeyIcon}
          loading={loading}
        />
        <StorageStatCell
          label="Labels"
          value={storage ? storage.labelCount : null}
          icon={TagIcon}
          loading={loading}
        />
        <StorageStatCell
          label="Version history"
          value={storage ? storage.versionHistoryEntries : null}
          icon={ClockCounterClockwiseIcon}
          loading={loading}
        />
      </div>

      {/* Manual cleanup */}
      <div
        className="border border-border p-6 md:p-8"
        style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.16s both" }}
      >
        <p className="label-mono text-muted-foreground">Delete inactive instances</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5 font-[450] max-w-xl">
          Permanently removes instances that have not reported a heartbeat for at least the selected
          period, together with their version history. Labels are kept. This cannot be undone.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Select
              value={String(days)}
              onValueChange={(v) => {
                setDays(Number(v ?? 30));
                setCandidatesLoading(true);
              }}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRUNE_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">or longer</span>
          </div>

          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger
              render={
                <Button variant="destructive" disabled={deleteDisabled}>
                  {deleting ? <Spinner /> : <TrashIcon />}
                  {deleting ? "Deleting…" : "Delete inactive"}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <WarningIcon />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete inactive instances?</AlertDialogTitle>
                <AlertDialogDescription>
                  {candidates !== null
                    ? `${candidates} instance${candidates === 1 ? "" : "s"} inactive for at least ${days} days will be permanently removed, including version history.`
                    : "Instances inactive for at least " + days + " days will be permanently removed, including version history."}{" "}
                  Labels are kept. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDialogOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? (
                    <>
                      <Spinner />
                      Deleting…
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mt-4 text-xs text-muted-foreground/70 font-[450]">
          {candidatesLoading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="size-3" />
              Checking for inactive instances…
            </span>
          ) : candidates !== null ? (
            candidates === 0 ? (
              "No instances are inactive for this period."
            ) : (
              `${candidates} inactive instance${candidates === 1 ? "" : "s"} found for the selected period.`
            )
          ) : (
            "Could not load the preview."
          )}
        </div>

        {result && <div className="mt-4 text-xs text-foreground/80 font-[450]">{result}</div>}
        {error && storage && <div className="mt-4 text-xs text-destructive font-[450]">{error}</div>}
      </div>

      {/* Delete a single instance by UUID */}
      <div
        className="border border-border p-6 md:p-8"
        style={{ animation: "fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) 0.24s both" }}
      >
        <p className="label-mono text-muted-foreground">Delete a specific instance</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5 font-[450] max-w-xl">
          Permanently removes a single instance by its UUID/GUID, together with its version history.
          Labels are kept. This cannot be undone.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <Input
            value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)}
            placeholder="Instance ID"
            className="w-full sm:w-[320px] font-mono text-xs"
            spellCheck={false}
          />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger
              render={
                <Button variant="destructive" disabled={deleteInstanceDisabled}>
                  {deletingInstance ? <Spinner /> : <TrashIcon />}
                  {deletingInstance ? "Deleting…" : "Delete instance"}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <WarningIcon />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete this instance?</AlertDialogTitle>
                <AlertDialogDescription>
                  Instance {instanceIdTrimmed} will be permanently removed, including its version
                  history. Labels are kept. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={confirmDeleteInstance} disabled={deletingInstance}>
                  {deletingInstance ? (
                    <>
                      <Spinner />
                      Deleting…
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {deleteResult && (
          <div className="mt-4 text-xs text-foreground/80 font-[450]">{deleteResult}</div>
        )}
        {deleteError && (
          <div className="mt-4 text-xs text-destructive font-[450]">{deleteError}</div>
        )}
      </div>
    </div>
  );
}
