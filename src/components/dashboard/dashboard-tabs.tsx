"use client";

import { useEffect, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoragePanel } from "./storage-panel";
import { fetchCandidatesCached, fetchStorageInfoCached } from "@/lib/storage-client";

function prefetchStorageData() {
  void fetchStorageInfoCached();
  void fetchCandidatesCached(30);
}

export function DashboardTabs({ children }: { children: ReactNode }) {
  useEffect(() => {
    prefetchStorageData();
  }, []);

  return (
    <Tabs defaultValue="dashboard">
      <TabsList variant="line" className="h-9">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="storage">Storage</TabsTrigger>
      </TabsList>
      <TabsContent
        value="dashboard"
        className="mt-6 flex flex-col gap-6 sm:mt-8 sm:gap-8 md:mt-10 md:gap-10 lg:mt-12 lg:gap-12"
      >
        {children}
      </TabsContent>
      <TabsContent value="storage" className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
        <StoragePanel />
      </TabsContent>
    </Tabs>
  );
}
