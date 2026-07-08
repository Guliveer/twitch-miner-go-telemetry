"use client";

import { Info } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function VersionDisclaimer() {
  return (
    <Dialog>
      <DialogTrigger className="text-muted-foreground/30 hover:text-accent transition-colors cursor-pointer" title="Version info">
        <Info size={16} weight="duotone" />
      </DialogTrigger>
      <DialogContent className="border border-border bg-background">
        <DialogTitle className="sr-only">Version info</DialogTitle>
        <div className="space-y-4 text-xs font-mono pt-2 pb-1">
          <p className="label-mono text-muted-foreground">Changelog</p>
          <div className="space-y-3">
            <div className="border border-border p-4">
              <div className="text-accent font-semibold mb-1 font-sans">[1.22.1]</div>
              <div className="text-muted-foreground font-[450]">
                Added active/configured accounts telemetry
              </div>
            </div>
            <div className="border border-border p-4">
              <div className="text-accent font-semibold mb-1 font-sans">[1.22.0]</div>
              <div className="text-muted-foreground font-[450]">
                First telemetry implementation
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
