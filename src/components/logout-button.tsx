"use client";

import { usePathname, useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  // The sign-in screen has no session to end, so it must not offer sign-out.
  if (pathname === "/login") return null;

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      aria-label="Sign out"
      className="size-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
    >
      <SignOut className="size-4" weight="duotone" />
    </Button>
  );
}
