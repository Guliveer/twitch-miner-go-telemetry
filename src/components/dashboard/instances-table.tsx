"use client";

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
import type { StoredInstance } from "@/lib/types";

interface InstancesTableProps {
  instances: StoredInstance[];
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

export function InstancesTable({ instances }: InstancesTableProps) {
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
        <CardTitle className="text-sm font-medium">
          Recent Instances ({instances.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instance ID</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Deployment</TableHead>
              <TableHead className="text-right">Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instances.map((inst) => (
              <TableRow key={inst.instanceId}>
                <TableCell className="font-mono text-xs">
                  {inst.instanceId.slice(0, 8)}...
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
