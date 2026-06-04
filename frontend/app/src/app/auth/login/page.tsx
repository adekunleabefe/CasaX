"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card } from "@casax/ui";
import { useCurrentUser } from "@/features/auth/queries";
import { loginSchema } from "@/features/auth/schemas";
import { login } from "@/services/auth";

type LoginValues = z.infer<typeof loginSchema>;
const WEB_AUTH_URL =
  (process.env.NEXT_PUBLIC_WEB_URL ?? "https://casax.ng") + "/auth/sign-up";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCard title="Sign in to CasaX" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const currentUser = useCurrentUser();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const nextPath = searchParams.get("next");
  const destination =
    nextPath?.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/dashboard";

  useEffect(() => {
    if (
      currentUser.isSuccess &&
      currentUser.isFetchedAfterMount &&
      currentUser.data
    ) {
      router.replace("/dashboard");
    }
  }, [
    currentUser.data,
    currentUser.isFetchedAfterMount,
    currentUser.isSuccess,
    router,
  ]);

  return (
    <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <p className="text-sm font-medium text-emerald-700">Welcome back</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Sign in to your CasaX operations portal
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        For landlords and onboarded residents managing portfolio visibility,
        rent, lease, maintenance, support, and operational records.
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          setError(undefined);
          try {
            const user = await login(values);
            queryClient.setQueryData(["auth", "me"], user);
            router.replace(destination);
            router.refresh();
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Unable to sign in. Please try again.",
            );
          }
        })}
      >
        <Field
          label="Email address"
          error={form.formState.errors.email?.message}
        >
          <input
            autoComplete="email"
            className={inputClass}
            placeholder="you@company.com"
            type="email"
            {...form.register("email")}
          />
        </Field>
        <Field
          label="Password"
          error={form.formState.errors.password?.message}
          action={
            <Link
              className="text-xs font-medium text-emerald-700"
              href="/auth/forgot-password"
            >
              Forgot password?
            </Link>
          }
        >
          <input
            autoComplete="current-password"
            className={inputClass}
            type="password"
            {...form.register("password")}
          />
        </Field>
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
          {form.formState.isSubmitting ? "Signing in..." : "Sign in securely"}
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">
        Looking for rentals?{" "}
        <Link className="font-medium text-emerald-700" href={WEB_AUTH_URL}>
          Create an applicant account on CasaX.ng
        </Link>
      </p>
    </Card>
  );
}

function AuthCard({ title }: { title: string }) {
  return (
    <Card className="p-9">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
      <h1 className="mt-4 text-3xl font-semibold">{title}</h1>
      <div className="mt-8 h-12 animate-pulse rounded-xl bg-slate-100" />
    </Card>
  );
}

function Field({
  label,
  error,
  children,
  action,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="flex items-center justify-between">
        {label}
        {action}
      </span>
      {children}
      {error ? (
        <span className="mt-2 block text-xs text-orange-700">{error}</span>
      ) : null}
    </label>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
