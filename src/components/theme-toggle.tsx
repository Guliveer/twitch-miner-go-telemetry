"use client";

import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Toggle theme" className="size-9">
        <span className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="size-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
    >
      {theme === "dark" ? <Sun className="size-4" weight="duotone" /> : <Moon className="size-4" weight="duotone" />}
    </Button>
  );
}
