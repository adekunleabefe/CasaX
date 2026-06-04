"use client";

import Link from "next/link";
import { Download, FileText, ReceiptText } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { useTenancyPayments } from "@/features/finance/queries";
import { useTenancies, useTenancyAgreement } from "@/features/tenancies/queries";

export default function DocumentsPage() {
  const tenancies = useTenancies("");
  const activeTenancy = tenancies.data?.items.find(
    (tenancy) => tenancy.status === "active" || tenancy.status === "pending",
  );
  const agreement = useTenancyAgreement(activeTenancy?.id ?? "");
  const payments = useTenancyPayments(activeTenancy?.id ?? "");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">Documents</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Receipts and documents
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Keep agreement documents, invoices and rent receipts in one place.
        </p>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {agreement.data && activeTenancy ? (
          <DocumentCard
            href="/agreement"
            icon={FileText}
            label="Agreement"
            title={agreement.data.title}
            meta={agreement.data.agreementNumber}
          />
        ) : (
          <Card className="py-10 text-center">
            <FileText className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-4 font-semibold text-slate-950">
              Your lease agreement will appear here once issued.
            </h2>
          </Card>
        )}

        {payments.data?.slice(0, 5).map((payment) => (
          <DocumentCard
            href={`/payments/${payment.id}`}
            icon={ReceiptText}
            key={payment.id}
            label="Receipt"
            title={`Rent ${new Intl.DateTimeFormat("en-NG", {
              month: "short",
              year: "numeric",
            }).format(new Date(payment.dueDate))}`}
            meta={payment.reference ?? "Receipt pending"}
          />
        ))}
      </section>
    </main>
  );
}

function DocumentCard({
  href,
  icon: Icon,
  label,
  meta,
  title,
}: {
  href: string;
  icon: typeof FileText;
  label: string;
  meta: string;
  title: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <h2 className="mt-2 truncate font-semibold text-slate-950">
              {title}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-500">{meta}</p>
          </div>
        </div>
        <Download className="size-4 shrink-0 text-slate-300" />
      </div>
      <Button asChild className="mt-5 w-full" variant="ghost">
        <Link href={href}>Open</Link>
      </Button>
    </Card>
  );
}
