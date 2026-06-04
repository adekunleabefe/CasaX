import { BarChart3 } from "lucide-react";
import { Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";

export default function AdminAnalyticsPage() {
  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX operations"
        title="Analytics"
        description="Platform-level trends and operational metrics will appear here."
      />
      <Card className="mt-8 py-14 text-center">
        <BarChart3 className="mx-auto size-8 text-slate-400" />
        <h2 className="mt-4 font-semibold text-slate-950">
          Analytics are being prepared.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          CasaX internal performance views will be connected in a later phase.
        </p>
      </Card>
    </main>
  );
}
