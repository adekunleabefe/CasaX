import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button, Logo } from "@casax/ui";

const trustPoints = [
  "Verified rentals",
  "Inspection booking",
  "Resident support",
];

const authImages = [
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
];

export function ApplicantAuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:h-screen lg:grid-cols-[minmax(420px,46%)_1fr] lg:overflow-hidden">
      <section className="relative hidden h-screen overflow-hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-10">
        <div className="absolute inset-0 -z-0 overflow-hidden">
          {authImages.map((image, index) => (
            <div
              aria-hidden="true"
              className="casax-auth-image absolute inset-0 bg-cover bg-center"
              key={image}
              style={{
                animationDelay: `${index * 7.5}s`,
                backgroundImage: `url(${image})`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(16,185,129,0.34),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.76),rgba(15,23,42,0.50)_48%,rgba(6,78,59,0.36))]" />
        <div className="relative z-10">
          <Link href="/" aria-label="CasaX home">
            <Logo className="text-white" />
          </Link>
        </div>
        <div className="relative z-10 max-w-xl">
          <p className="mb-4 w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100 backdrop-blur">
            CasaX account
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] xl:text-5xl">
            Find verified apartments without agent stress.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-slate-100">
            Browse CasaX-reviewed rentals, book inspections, apply online, and
            continue securely.
          </p>
          <div className="mt-8 grid gap-3">
            {trustPoints.map((point) => (
              <div
                className="casax-auth-trust-card flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-slate-100 backdrop-blur"
                key={point}
                style={{ animationDelay: `${indexDelay(point)}ms` }}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-100">
                  <CheckCircle2 className="size-4" />
                </span>
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:px-12 lg:py-6">
        <Button
          className="absolute right-5 top-5 hidden h-10 rounded-full border-slate-200 bg-white px-4 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 lg:inline-flex"
          variant="outline"
          asChild
        >
          <Link href="/rentals">
            <ArrowLeft className="mr-2 size-4" />
            Back to rentals
          </Link>
        </Button>
        <div className="casax-auth-card w-full max-w-md lg:py-6">
          <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
            <Link href="/" aria-label="CasaX home">
              <Logo className="text-slate-950" />
            </Link>
            <Link
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
              href="/rentals"
            >
              Back to rentals
            </Link>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

function indexDelay(point: string) {
  return trustPoints.indexOf(point) * 120;
}
