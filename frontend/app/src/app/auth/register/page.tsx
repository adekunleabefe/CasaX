"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card } from "@casax/ui";
import { useCurrentUser } from "@/features/auth/queries";
import { registerSchema } from "@/features/auth/schemas";
import { register } from "@/services/auth";

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [accountCreated, setAccountCreated] = useState(false);
  const currentUser = useCurrentUser();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "LANDLORD",
    },
  });

  useEffect(() => {
    if (
      currentUser.isSuccess &&
      currentUser.isFetchedAfterMount &&
      currentUser.data &&
      !accountCreated
    ) {
      router.replace("/dashboard");
    }
  }, [
    accountCreated,
    currentUser.data,
    currentUser.isFetchedAfterMount,
    currentUser.isSuccess,
    router,
  ]);

  if (accountCreated) {
    return (
      <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
        <p className="text-sm font-medium text-emerald-700">Account created</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Check your inbox
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Verification email sent. Check your inbox.
        </p>
        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          Open the verification link we sent to finish securing your CasaX
          account. You can sign in after verification is complete.
        </div>
        <Button asChild className="mt-8 w-full">
          <Link href="/auth/login">Continue to sign in</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <p className="text-sm font-medium text-emerald-700">Get started</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Create your workspace
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Start with operational visibility for your properties or applications.
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          setError(undefined);
          try {
            await register(values);
            setAccountCreated(true);
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Unable to create your account.",
            );
          }
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            error={form.formState.errors.firstName?.message}
          >
            <input className={inputClass} {...form.register("firstName")} />
          </Field>
          <Field
            label="Last name"
            error={form.formState.errors.lastName?.message}
          >
            <input className={inputClass} {...form.register("lastName")} />
          </Field>
        </div>
        <Field
          label="Email address"
          error={form.formState.errors.email?.message}
        >
          <input
            autoComplete="email"
            className={inputClass}
            type="email"
            {...form.register("email")}
          />
        </Field>
        <Field
          label="Workspace type"
          error={form.formState.errors.role?.message}
        >
          <select className={inputClass} {...form.register("role")}>
            <option value="LANDLORD">Landlord operations</option>
            <option value="APPLICANT">Applicant access</option>
          </select>
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <input
            autoComplete="new-password"
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
          {form.formState.isSubmitting
            ? "Creating account..."
            : "Create account"}
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link className="font-medium text-emerald-700" href="/auth/login">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? (
        <span className="mt-2 block text-xs text-orange-700">{error}</span>
      ) : null}
    </label>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
