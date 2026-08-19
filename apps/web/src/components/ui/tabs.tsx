import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Tabs({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-tabs", className)} {...props} />;
}

type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function TabsTrigger({ active = false, className, ...props }: TabsTriggerProps) {
  return <button className={cn("ui-tabs-trigger", active && "active", className)} {...props} />;
}
