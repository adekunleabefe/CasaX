import type { HTMLAttributes } from "react";
import { cn } from "@casax/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700",
        className,
      )}
      {...props}
    />
  );
}
