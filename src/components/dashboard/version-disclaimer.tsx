"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function VersionDisclaimer() {
  return (
    <Dialog>
      <DialogTrigger className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer">
        <InfoIcon size={16} />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="sr-only">Version info</DialogTitle>
        <div className="space-y-2 text-xs font-mono pt-2 pb-1">
          <div className="text-muted-foreground/40"># Changelog</div>
          <div>
            <div className="text-foreground font-semibold">[1.22.1]</div>
            <div className="text-muted-foreground pl-4">
              Added active/configured accounts telemetry
            </div>
          </div>
          <div>
            <div className="text-foreground font-semibold">[1.22.0]</div>
            <div className="text-muted-foreground pl-4">
              First telemetry implementation
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
