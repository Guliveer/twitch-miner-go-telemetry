"use client";

import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out">
      <SignOut className="size-4" />
    </Button>
  );
}
