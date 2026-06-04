import { AlertTriangle, Building2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button, Card } from "@casax/ui";

export function LoadingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <Card className="animate-pulse" key={item}>
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="mt-5 h-7 w-40 rounded bg-slate-100" />
          <div className="mt-4 h-4 w-full rounded bg-slate-100" />
        </Card>
      ))}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load this data",
  onRetry,
}: {
  title?: string;
  onRetry: () => void;
}) {
  return (
    <Card className="flex flex-col items-start gap-4 border-orange-100 bg-orange-50/40">
      <AlertTriangle className="size-6 text-orange-600" />
      <div>
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Check your connection or session and try again.
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}

export function EmptyProperties({ action }: { action: ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50">
        <Building2 className="size-6 text-emerald-700" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">Add your first property</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        Start tracking units, occupancy status, and operational activity from
        one verified portfolio record.
      </p>
      <div className="mt-7">{action}</div>
    </Card>
  );
}
