import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button, Card, Logo } from "@casax/ui";

export const metadata: Metadata = {
  title: "Continue Securely | CasaX",
  description: "Continue your CasaX rental request securely.",
};

export default function AuthHandoffPage() {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 px-5 py-12">
      <Card className="w-full max-w-md border-slate-200/80 p-7 shadow-[0_24px_55px_-32px_rgba(15,23,42,0.34)] sm:p-9">
        <Logo />
        <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <LockKeyhole className="size-5" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          Continue securely
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Sign in or create an applicant account to continue your rental
          request.
        </p>
        <div className="mt-8 grid gap-3">
          <Button className="w-full rounded-xl" asChild>
            <Link href="https://app.casax.ng/auth/login">Login</Link>
          </Button>
          <Button className="w-full rounded-xl" variant="outline" asChild>
            <Link href="https://app.casax.ng/auth/register">
              Create account
            </Link>
          </Button>
        </div>
        <p className="mt-7 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          CasaX protects applications and inspection requests through secure
          applicant access.
        </p>
      </Card>
    </main>
  );
}
