"use client";

import { Moon, Sun } from "lucide-react";
import { toggleTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      aria-label="Toggle theme"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
      onClick={() => toggleTheme()}
      title="Toggle theme"
      type="button"
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}
