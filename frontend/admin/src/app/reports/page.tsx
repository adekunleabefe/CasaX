import { FileText } from "lucide-react";
import { Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";

export default function AdminReportsPage() {
  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="CasaX operations"
        title="Reports"
        description="Portfolio reports, remittance statements, and operational summaries will appear here."
      />
      <Card className="mt-8 py-14 text-center">
        <FileText className="mx-auto size-8 text-slate-400" />
        <h2 className="mt-4 font-semibold text-slate-950">
          Reports are being prepared.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Monthly operations reports will be generated here when reporting is
          connected.
        </p>
      </Card>
    </main>
  );
}
