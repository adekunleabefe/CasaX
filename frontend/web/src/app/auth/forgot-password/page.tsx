"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck, ShieldCheck } from "lucide-react";
import { Button, Card } from "@casax/ui";
import { ApplicantAuthShell } from "@/components/applicant-auth-shell";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  return (
    <ApplicantAuthShell>
      <Card className="border-slate-200/80 bg-white p-7 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.38)] sm:p-9">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <MailCheck className="size-5" />
        </div>
        <p className="mt-6 text-sm font-medium text-emerald-700">
          Account recovery
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          Reset your CasaX password
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Enter the email connected to your CasaX account. If it exists,
          CasaX will send a secure recovery link.
        </p>
        <form
          className="mt-7 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(undefined);
            try {
              await forgotPassword(String(form.get("email") ?? ""));
              setSent(true);
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Unable to prepare the recovery email.",
              );
            }
          }}
        >
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              name="email"
              required
              type="email"
            />
          </label>
          {sent ? (
            <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              If an account exists, a reset link has been sent.
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
              {error}
            </p>
          ) : null}
          <Button className="w-full rounded-xl" type="submit">
            Send reset link
          </Button>
        </form>
        <Button className="mt-4 w-full rounded-xl" variant="outline" asChild>
          <Link href="/auth/sign-in">Return to sign in</Link>
        </Button>
        <p className="mt-7 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          For your security, CasaX will only send password links to verified
          account emails.
        </p>
      </Card>
    </ApplicantAuthShell>
  );
}
