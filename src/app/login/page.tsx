"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Monitor } from "@phosphor-icons/react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.has("error");

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/15 mb-4">
            <Monitor className="size-6 text-accent" weight="duotone" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            twitch-miner-go
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Telemetry Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border bg-card p-6 md:p-8 shadow-md">
          <form action="/api/auth" method="POST" className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                autoFocus
                autoComplete="username"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-10"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center">
                Invalid username or password
              </div>
            )}

            <Button type="submit" className="w-full h-10 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-semibold transition-all duration-200">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
