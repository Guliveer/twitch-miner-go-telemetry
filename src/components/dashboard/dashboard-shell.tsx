"use client";

import { type ReactNode } from "react";
import { TimeRangeProvider } from "./time-range-context";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <TimeRangeProvider>
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 py-10 md:py-14 lg:py-16 flex flex-col gap-8 md:gap-10 lg:gap-12">
        {children}
      </div>
    </TimeRangeProvider>
  );
}
