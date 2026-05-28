import { Building2 } from "lucide-react";
import { cn } from "@casax/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
        <Building2 className="size-5" />
      </span>
      CasaX
    </div>
  );
}
