"use client";

import type { ReactNode } from "react";

export function HeaderScroll({ children }: { children: ReactNode }) {
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-12 px-6 md:px-10 bg-background border-b border-border">
      {children}
    </div>
  );
}
