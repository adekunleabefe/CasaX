"use client";

import { LifeBuoy, MessageSquare } from "lucide-react";
import { Button, Card } from "@casax/ui";

export default function ResidentSupportPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-10">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">
          Resident support
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          How can CasaX help?
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Support requests, resident communication, and service updates will be
          organized here.
        </p>
      </header>
      <section className="mt-6 grid gap-5 md:grid-cols-2">
        <Card>
          <LifeBuoy className="size-6 text-emerald-700" />
          <h2 className="mt-4 font-semibold text-slate-950">
            No support requests yet.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            When you contact CasaX about your home, the conversation will
            appear here.
          </p>
          <Button className="mt-6">Contact support</Button>
        </Card>
        <Card className="bg-slate-950 text-white">
          <MessageSquare className="size-6 text-emerald-300" />
          <h2 className="mt-4 font-semibold">Resident communication</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Future WhatsApp reminders, service updates, and support chat will
            connect into this space.
          </p>
        </Card>
      </section>
    </main>
  );
}
