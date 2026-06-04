import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@casax/ui";

const assurances = [
  "Landlord workspace",
  "Resident portal",
  "Secure operations access",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(360px,44%)_1fr]">
      <aside className="hidden flex-col justify-between bg-slate-950 p-12 text-white lg:flex">
        <Link href="/auth/login">
          <Logo className="[&>span]:bg-white [&>span]:text-slate-950" />
        </Link>
        <div>
          <p className="text-sm font-medium text-emerald-400">
            CasaX operations portal
          </p>
          <h1 className="mt-5 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Portfolio visibility and resident operations stay connected after
            onboarding.
          </h1>
          <div className="mt-10 space-y-4">
            {assurances.map((assurance) => (
              <p
                className="flex items-center gap-3 text-sm text-slate-300"
                key={assurance}
              >
                <CheckCircle2 className="size-5 text-emerald-400" />
                {assurance}
              </p>
            ))}
          </div>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="size-4 text-emerald-400" />
          Secure, cookie-based workspace access
        </p>
      </aside>
      <section className="flex min-h-screen items-center justify-center bg-slate-50 p-5 sm:p-8">
        <div className="w-full max-w-md">
          <Link className="mb-10 inline-flex lg:hidden" href="/auth/login">
            <Logo />
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
