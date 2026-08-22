"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ToastProps = {
  message: string;
  tone?: "error" | "success";
  onDismiss: () => void;
};

export function Toast({ message, tone = "error", onDismiss }: ToastProps) {
  return (
    <Card
      className={cn(
        "fixed bottom-6 right-6 z-50 flex max-w-[min(420px,calc(100vw-2rem))] items-center gap-3 p-3",
        tone === "error" && "border-destructive/60",
      )}
      role="status"
    >
      <span className="text-sm leading-snug">{message}</span>
      <Button aria-label="Dismiss notification" onClick={onDismiss} size="sm" type="button" variant="ghost">
        <X />
      </Button>
    </Card>
  );
}
