"use client";

import { BarChart3, FileText, Home, Landmark, ReceiptText } from "lucide-react";
import { Card } from "@casax/ui";
import { PageHeader } from "@/components/operations/page-header";

export default function ReportsPage() {
  return (
    <main className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Reports"
        title="Reports"
        description="Monthly portfolio summaries, rent collection reports, remittance statements, and operational updates will appear here."
      />

      <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReportEmptyState
              icon={FileText}
              title="Monthly Portfolio Reports"
              detail="Monthly summaries across occupancy, vacancies, and CasaX coordination will appear here."
            />
            <ReportEmptyState
              icon={ReceiptText}
              title="Rent Collection Reports"
              detail="Rent collection performance and outstanding rent summaries will appear here."
            />
            <ReportEmptyState
              icon={Landmark}
              title="Remittance Statements"
              detail="Landlord payout statements and remittance history will appear here."
            />
            <ReportEmptyState
              icon={Home}
              title="Occupancy Reports"
              detail="Occupancy movement, resident counts, and vacancy trends will appear here."
            />
          </div>
        </Card>

        <Card className="py-16 text-center">
          <BarChart3 className="mx-auto size-9 text-slate-400" />
          <h2 className="mt-5 text-lg font-semibold text-slate-950">
            Reports are being prepared.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            CasaX will surface monthly summaries, remittance statements, and
            property operation reports here.
          </p>
        </Card>

      </section>
    </main>
  );
}

function ReportEmptyState({
  detail,
  icon: Icon,
  title,
}: {
  detail: string;
  icon: typeof FileText;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <Icon className="size-5 text-emerald-700" />
      <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}
