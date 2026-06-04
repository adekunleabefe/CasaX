import { Activity } from "lucide-react";
import { Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";

export default function AdminActivityPage() {
  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX operations"
        title="Activity logs"
        description="Internal audit trails and operational events will appear here."
      />
      <Card className="mt-8 py-14 text-center">
        <Activity className="mx-auto size-8 text-slate-400" />
        <h2 className="mt-4 font-semibold text-slate-950">
          Activity logs are being prepared.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          CasaX operational audit records will surface here once connected.
        </p>
      </Card>
    </main>
  );
}
