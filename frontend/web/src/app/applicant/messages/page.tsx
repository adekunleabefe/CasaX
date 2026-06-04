import { MessageSquare } from "lucide-react";
import { Card } from "@casax/ui";

export default function ApplicantMessagesPage() {
  return (
    <>
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-medium text-emerald-700">
          CasaX account
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Messages
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          CasaX updates about inspections, applications, and onboarding will
          appear here.
        </p>
      </header>

      <Card className="mt-8 py-14 text-center">
        <MessageSquare className="mx-auto size-8 text-slate-400" />
        <h2 className="mt-4 font-semibold text-slate-950">
          No messages yet.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          When CasaX has an update about your rental journey, it will be kept
          here for easy reference.
        </p>
      </Card>
    </>
  );
}
