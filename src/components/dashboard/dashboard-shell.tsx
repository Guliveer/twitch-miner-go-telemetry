"use client";

import { type ReactNode } from "react";
import { TimeRangeProvider } from "./time-range-context";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <TimeRangeProvider>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 sm:py-8 md:py-14 lg:py-16 flex flex-col gap-6 sm:gap-8 md:gap-10 lg:gap-12 pb-8 sm:pb-10 md:pb-14 lg:pb-16">
        {children}
      </div>
    </TimeRangeProvider>
  );
}
