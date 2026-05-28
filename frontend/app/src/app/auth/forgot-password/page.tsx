"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card } from "@casax/ui";
import { recoverySchema } from "@/features/auth/schemas";
import { requestPasswordReset } from "@/services/auth";

type RecoveryValues = z.infer<typeof recoverySchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string>();
  const [error, setError] = useState<string>();
  const form = useForm<RecoveryValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: "" },
  });

  return (
    <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <p className="text-sm font-medium text-emerald-700">Account recovery</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Reset your password
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Enter your email address and we will prepare a secure recovery link.
      </p>
      {submittedEmail ? (
        <div className="mt-8 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          If an account exists, a reset link has been sent.
        </div>
      ) : (
        <form
          className="mt-8 space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            setError(undefined);
            try {
              await requestPasswordReset(values.email);
              setSubmittedEmail(values.email);
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Unable to submit the recovery request.",
              );
            }
          })}
        >
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              autoComplete="email"
              className={inputClass}
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <span className="mt-2 block text-xs text-orange-700">
                {form.formState.errors.email.message}
              </span>
            ) : null}
          </label>
          {error ? (
            <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
              {error}
            </p>
          ) : null}
          <Button
            className="w-full"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting ? "Preparing link..." : "Continue"}
          </Button>
        </form>
      )}
      <Link
        className="mt-7 block text-center text-sm font-medium text-emerald-700"
        href="/auth/login"
      >
        Back to sign in
      </Link>
    </Card>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
