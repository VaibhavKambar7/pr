import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "tab";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return <button className={cn("ui-button", `ui-button-${variant}`, className)} {...props} />;
}
