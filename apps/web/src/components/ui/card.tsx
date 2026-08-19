import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
};

export function Card({ as: Component = "div", className, ...props }: CardProps) {
  return <Component className={cn("ui-card", className)} {...props} />;
}
