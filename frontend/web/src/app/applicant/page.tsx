"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Search,
  Sparkles,
} from "lucide-react";
import { Button, Card } from "@casax/ui";
import {
  useApplications,
  useInspectionBookings,
  useSavedRentals,
} from "@/lib/applicant-queries";
import { ApplicationStatusChip } from "@/components/applicant/status-chip";

export default function AccountOverviewPage() {
  const saved = useSavedRentals();
  const inspections = useInspectionBookings();
  const applications = useApplications();
  const items = applications.data?.items ?? [];
  const activeApplications = items.filter((item) =>
    [
      "pending",
      "submitted",
      "inspection_required",
      "inspection_scheduled",
      "inspection_booked",
      "under_review",
    ].includes(item.status),
  );

  return (
    <>
      <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-semibold text-emerald-700">
          CasaX account
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Welcome to CasaX
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Save apartments, compare options, book inspections, and track your
          applications in one place.
        </p>
      </section>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Bookmark} label="Saved rentals" value={saved.data?.length ?? 0} />
        <Metric
          icon={CalendarDays}
          label="Upcoming inspections"
          value={
            inspections.data?.filter((item) =>
              ["pending", "confirmed"].includes(item.status),
            ).length ?? 0
          }
        />
        <Metric icon={ClipboardCheck} label="Applications" value={items.length} />
        <Metric
          icon={Clock3}
          label="Under review"
          value={activeApplications.length}
        />
      </section>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="border-slate-200 bg-white shadow-sm shadow-slate-200/50">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Recent activity
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Rental progress
              </h2>
            </div>
            <Button asChild variant="ghost">
              <Link href="/applicant/applications">View applications</Link>
            </Button>
          </div>
          {applications.isLoading ? (
            <div className="mt-6 h-28 animate-pulse rounded-2xl bg-slate-100" />
          ) : null}
          {items.length ? (
            <div className="mt-7 space-y-4">
              {items.slice(0, 4).map((item) => (
                <Link
                  className="group flex gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/40"
                  href={`/applicant/applications/${item.id}`}
                  key={item.id}
                >
                  <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                    <ClipboardCheck className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-950">
                      {item.property.name} / {item.unit.name}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {nextStep(item.status)}
                    </span>
                  </span>
                  <span className="hidden shrink-0 sm:block">
                    <ApplicationStatusChip status={item.status} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyPanel
              icon={Sparkles}
              title="Your rental journey starts here."
              text="Save verified rentals, book inspections, and track applications from one calm account space."
              cta="Browse verified rentals"
              href="/rentals"
            />
          )}
        </Card>

        <Card className="overflow-hidden border-slate-200 bg-slate-950 p-0 text-white shadow-sm">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.35),transparent_34%),linear-gradient(135deg,#020617,#0f172a)] p-6">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
              <Search className="size-5" />
            </div>
            <h2 className="mt-8 text-2xl font-semibold tracking-tight">
              Continue your rental search
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Explore CasaX-reviewed rentals, then save, inspect, or apply when
              a home feels right.
            </p>
            <Button
              className="mt-7 rounded-2xl bg-white text-slate-950 hover:bg-slate-100"
              asChild
            >
              <Link href="/rentals">
                Browse rentals
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bookmark;
  label: string;
  value: number;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm shadow-slate-200/50">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon className="size-5" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </Card>
  );
}

function EmptyPanel({
  cta,
  href,
  icon: Icon,
  text,
  title,
}: {
  cta: string;
  href: string;
  icon: typeof Sparkles;
  text: string;
  title: string;
}) {
  return (
    <div className="mt-7 rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
        <Icon className="size-5" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {text}
      </p>
      <Button asChild className="mt-6 rounded-2xl">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}

function nextStep(status: string) {
  const labels: Record<string, string> = {
    submitted: "Application review",
    pending: "Application review",
    inspection_required: "Book inspection",
    inspection_scheduled: "Attend inspection",
    inspection_booked: "Attend inspection",
    under_review: "Await review outcome",
    approved: "Resident conversion pending lease setup",
    rejected: "Review another rental",
    converted_to_resident: "Continue as resident",
    converted_to_tenant: "Continue as resident",
  };
  return labels[status] ?? "Await CasaX update";
}
