"use client";

import Link from "next/link";
import { Camera, CheckCircle2, Clock3, LifeBuoy, MessageSquare, Wrench } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { useCurrentUser } from "@/features/auth/queries";

export default function MaintenancePage() {
  const currentUser = useCurrentUser();
  const role = currentUser.data?.role;
  const isTenant = role === "tenant";

  if (currentUser.isLoading) {
    return (
      <main className="mx-auto max-w-6xl p-5 lg:p-8">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
      </main>
    );
  }

  if (isTenant) {
    return <TenantMaintenancePage />;
  }

  return (
    <main className="mx-auto max-w-6xl p-5 lg:p-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">
          {isTenant ? "Resident support" : "Maintenance"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {isTenant ? "Get help with your home" : "Resident maintenance queue"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          {isTenant
            ? "Maintenance requests and resident messages will live here in a simple, trackable flow."
            : "Track resident requests for assigned or owned units without mixing them into portfolio administration."}
        </p>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Wrench className="size-5" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-950">
            Maintenance requests are coming soon
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            CasaX is ready for a resident-first maintenance flow: submit an
            issue, follow updates, and keep communication attached to the home.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">Return to dashboard</Link>
          </Button>
        </Card>

        <Card className="bg-slate-950 text-white">
          <MessageSquare className="size-5 text-emerald-300" />
          <h2 className="mt-5 text-lg font-semibold">Resident communication</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This area is structured for future updates, push notifications and
            direct resident communication.
          </p>
        </Card>
      </section>

    </main>
  );
}

function TenantMaintenancePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">Maintenance</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Need help at home?
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Report issues, add photos and follow updates in a simple resident
              support flow.
            </p>
          </div>
          <Button className="w-full sm:w-auto">Report an issue</Button>
        </div>
      </header>

      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Requests
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                No maintenance requests yet.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Need help at home? Report an issue anytime.
              </p>
            </div>
            <LifeBuoy className="size-6 text-emerald-700" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {["submitted", "in review", "assigned", "in progress", "resolved"].map(
              (status) => (
                <span
                  className="rounded-full bg-slate-50 px-4 py-2 text-center text-xs font-medium capitalize text-slate-600"
                  key={status}
                >
                  {status}
                </span>
              ),
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <Camera className="size-5 text-emerald-700" />
            <h2 className="mt-4 font-semibold text-slate-950">
              Add photos
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Image upload will help your manager understand the issue faster.
            </p>
          </Card>
          <Card className="bg-emerald-50/60">
            <MessageSquare className="size-5 text-emerald-700" />
            <h2 className="mt-4 font-semibold text-slate-950">
              Support chat placeholder
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Future resident communication and WhatsApp updates will connect
              here.
            </p>
          </Card>
        </div>
      </section>

      <Card className="mt-6">
        <p className="text-sm font-medium text-emerald-700">Request timeline</p>
        <div className="mt-6 space-y-4">
          <TimelineItem icon={Clock3} title="Submitted" detail="Your request is received." />
          <TimelineItem icon={Wrench} title="In progress" detail="A manager or technician is working on it." />
          <TimelineItem icon={CheckCircle2} title="Resolved" detail="You can review the completed request." />
        </div>
      </Card>
    </main>
  );
}

function TimelineItem({
  detail,
  icon: Icon,
  title,
}: {
  detail: string;
  icon: typeof Clock3;
  title: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-950">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
