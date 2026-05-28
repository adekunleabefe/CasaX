import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@casax/ui";

const metrics = [
  { label: "Active landlords", value: "1,286", detail: "+23 this week" },
  { label: "Managed units", value: "18,940", detail: "91% occupied" },
  { label: "Open disputes", value: "14", detail: "4 urgent" },
  { label: "Subscriptions MRR", value: "NGN 28.4m", detail: "+8.2%" },
];

export default function AdminDashboardPage() {
  return (
    <main className="p-5 lg:p-8">
      <div>
        <p className="text-sm text-slate-500">Platform control center</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Operations dashboard
        </h1>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-4 text-3xl font-semibold">{metric.value}</p>
            <p className="mt-3 text-xs font-medium text-emerald-700">
              {metric.detail}
            </p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Review queue</h2>
            <ArrowRight className="size-4 text-slate-400" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-4 text-sm">
              <AlertTriangle className="size-5 text-orange-600" />4 payment
              disputes require a response today
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm">
              <CheckCircle2 className="size-5 text-emerald-600" />
              12 vacancy listings verified against unit records
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Platform health</h2>
          <dl className="mt-6 space-y-5 text-sm">
            {[
              ["Payments reconciled", "98.7%"],
              ["Pending applications", "214"],
              ["Maintenance resolution rate", "94.1%"],
            ].map(([label, value]) => (
              <div
                className="flex justify-between border-b border-slate-100 pb-4"
                key={label}
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </main>
  );
}
