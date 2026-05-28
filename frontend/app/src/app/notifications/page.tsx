"use client";

import { BellRing, MessageCircle, Smartphone } from "lucide-react";
import { Card } from "@casax/ui";

const reminders = [
  {
    title: "Rent reminders",
    detail: "Upcoming rent and receipt updates will appear here.",
    icon: BellRing,
  },
  {
    title: "Resident announcements",
    detail: "Property notices and resident updates will be grouped here.",
    icon: MessageCircle,
  },
  {
    title: "WhatsApp reminders",
    detail: "Future WhatsApp and push reminders will connect from here.",
    icon: Smartphone,
  },
];

export default function NotificationsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">Notifications</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Updates and reminders
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Rent reminders, maintenance updates and resident announcements will
          live here.
        </p>
      </header>

      <section className="mt-6 grid gap-4">
        {reminders.map(({ detail, icon: Icon, title }) => (
          <Card key={title}>
            <div className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Icon className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {detail}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </main>
  );
}
