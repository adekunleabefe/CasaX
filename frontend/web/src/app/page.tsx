import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Headphones,
  Home,
  KeyRound,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import { Badge, Button, Card } from "@casax/ui";
import { RentalCard } from "@/components/rental-card";
import { getRentals, previewRentals } from "@/lib/rentals";

export const metadata: Metadata = {
  title: "Verified Apartments in Nigeria | CasaX Rentals",
  description:
    "Find verified apartments for rent, book inspections, and apply online through CasaX-reviewed rentals in Lagos and across Nigeria.",
  keywords: [
    "verified apartments Nigeria",
    "apartments for rent",
    "rentals",
    "inspection booking",
    "verified rentals Lagos",
  ],
};

const rentalTypes = [
  "All",
  "Mini flat",
  "Self-contained",
  "1 Bedroom",
  "2 Bedroom",
  "3 Bedroom",
  "Studio",
  "House",
];

const trustCards = [
  {
    title: "Property information reviewed",
    detail: "Every rental goes through a review process before it appears on CasaX.",
    icon: ShieldCheck,
  },
  {
    title: "Unit photos checked",
    detail: "Photos and core apartment details are prepared before inspection.",
    icon: Camera,
  },
  {
    title: "Rent details prepared",
    detail: "Annual rent and apartment information are made clear before you visit.",
    icon: CalendarDays,
  },
  {
    title: "Inspection route available",
    detail: "You can request inspection support without chasing multiple contacts.",
    icon: ClipboardCheck,
  },
];

const heroTrustBadges = [
  { label: "Verified rentals", icon: ShieldCheck },
  { label: "Affordable options", icon: BadgeCheck },
  { label: "Book inspections", icon: CalendarDays },
  { label: "Move-in support", icon: Headphones },
];

const heroImages = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=80",
];

const renterJourney = [
  {
    title: "Browse",
    detail: "Discover verified apartments that fit your budget and location.",
    icon: Search,
  },
  {
    title: "Book inspection",
    detail: "Choose a rental and request an inspection through CasaX.",
    icon: CalendarDays,
  },
  {
    title: "Apply",
    detail: "Submit your application and track what happens next.",
    icon: FileText,
  },
  {
    title: "Move in",
    detail: "Complete onboarding and start your tenancy with support when needed.",
    icon: KeyRound,
  },
];

const residentServices = [
  {
    title: "Rent tracking",
    detail: "Keep track of rent history and upcoming payments.",
    icon: ReceiptText,
  },
  {
    title: "Maintenance coordination",
    detail: "Report and monitor maintenance requests.",
    icon: Wrench,
  },
  {
    title: "Renewal support",
    detail: "Receive reminders before lease expiry.",
    icon: RefreshCw,
  },
  {
    title: "Lease records",
    detail: "Access important tenancy documents anytime.",
    icon: FileText,
  },
  {
    title: "Resident support",
    detail: "Get help when questions come up during your tenancy.",
    icon: Headphones,
  },
  {
    title: "Home records",
    detail: "Keep your rental history connected to your CasaX account.",
    icon: Home,
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
      {children}
    </p>
  );
}

export default async function HomePage() {
  const rentals = await getRentals({}).catch(() => ({
    items: [],
    pagination: { page: 1, limit: 24, total: 0, totalPages: 0 },
  }));
  const hasLiveRentals = rentals.items.length > 0;
  const featuredRentals = hasLiveRentals
    ? rentals.items.slice(0, 6)
    : previewRentals.slice(0, 6);

  return (
    <main className="overflow-hidden bg-white">
      <section className="relative isolate bg-slate-900 text-white">
        <div className="absolute inset-0 -z-20 overflow-hidden">
          {heroImages.map((image, index) => (
            <div
              aria-hidden="true"
              className="casax-hero-image absolute inset-0 bg-cover bg-center"
              key={image}
              style={{
                animationDelay: `${index * 7.5}s`,
                backgroundImage: `url(${image})`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_30%,rgba(16,185,129,0.26),transparent_32%),radial-gradient(circle_at_48%_8%,rgba(255,255,255,0.14),transparent_25%),linear-gradient(108deg,rgba(15,23,42,0.58),rgba(15,23,42,0.34)_50%,rgba(6,78,59,0.14))]" />
        <div className="mx-auto max-w-7xl px-5 py-14 sm:py-16 lg:px-8 lg:py-24">
          <div className="max-w-3xl rounded-[2rem] bg-slate-950/15 p-0 backdrop-blur-[1px]">
            <Badge className="mb-7 border-white/10 bg-white/10 px-4 py-2 text-emerald-100 backdrop-blur">
              <BadgeCheck className="mr-2 size-4 text-emerald-300" />
              CasaX-reviewed rentals
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-[4.6rem] lg:leading-[1.05]">
              Affordable apartments. Verified before you visit.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">
              Browse CasaX-reviewed rentals, compare options, book inspections,
              and apply with a clear next step.
            </p>
          </div>

          <Card className="mt-10 max-w-5xl border-white/10 bg-white/95 p-3 shadow-[0_34px_90px_-42px_rgba(0,0,0,0.72)] backdrop-blur">
            <form
              action="/rentals"
              className="grid gap-3 lg:grid-cols-[1.35fr_1fr_1fr_auto]"
            >
              <SearchField name="location" placeholder="Location" />
              <SearchField name="unitType" placeholder="Unit type" />
              <SearchField name="maxRent" placeholder="Budget" />
              <Button className="h-12 rounded-xl bg-slate-950 px-6 text-white hover:bg-slate-800">
                <Search className="mr-2 size-4" />
                Search
              </Button>
            </form>
          </Card>
          <div className="mt-5 flex max-w-5xl flex-wrap gap-2">
            {heroTrustBadges.map(({ label, icon: Icon }) => (
              <div
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-medium text-slate-100 backdrop-blur"
                key={label}
              >
                <Icon className="size-3.5 text-emerald-300" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:justify-center lg:justify-start">
          {rentalTypes.map((type) => (
            <Link
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition ${
                type === "All"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              href={
                type === "All"
                  ? "/rentals"
                  : `/rentals?unitType=${encodeURIComponent(type)}`
              }
              key={type}
            >
              {type}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:pb-16 lg:px-8 lg:pb-20">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <SectionLabel>Featured rentals</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Verified apartments you can actually rent
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Browse available rentals reviewed through the CasaX process, with
              clear rent details and inspection options.
            </p>
          </div>
          <Button className="w-fit rounded-full" variant="outline" asChild>
            <Link href="/rentals">
              View all rentals <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
        {!hasLiveRentals ? (
          <Card className="mt-8 border-dashed border-slate-300 bg-slate-50 px-6 py-7 text-center shadow-none">
            <h3 className="font-semibold text-slate-950">
              Explore sample apartments while CasaX expands verified rental
              coverage.
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Preview apartments use property marketing information only. Live
              verified rentals will appear automatically once published.
            </p>
          </Card>
        ) : null}
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredRentals.map((rental) => (
            <RentalCard key={rental.slug} rental={rental} />
          ))}
          {featuredRentals.length < 3 ? (
            <HowCasaXVerifiesCard className="md:col-span-2 lg:col-span-1" />
          ) : null}
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <SectionLabel>Why renters trust CasaX</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Know what you&apos;re walking into before you visit.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              We review rental information, coordinate inspections, and guide
              your next step so you can avoid unnecessary agent stress.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {trustCards.map(({ title, detail, icon: Icon }) => (
              <Card
                className="border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_-28px_rgba(15,23,42,0.35)]"
                key={title}
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                      {detail}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 sm:py-20 lg:px-8 lg:py-24"
        id="how-it-works"
      >
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Your next apartment in four simple steps
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            No chasing agents. No uncertainty. Just a clear path from search to
            move-in.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renterJourney.map(({ title, detail, icon: Icon }, index) => (
            <Card
              className="border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-[0_20px_36px_-24px_rgba(15,23,42,0.28)]"
              key={title}
            >
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-emerald-700" />
                <span className="text-xs font-semibold text-slate-400">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-5 font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[360px_1fr] lg:items-start">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Resident support
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Your rental journey doesn&apos;t end after move-in.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-400">
                CasaX keeps rent records, inspection history, maintenance
                coordination, and tenancy support connected in one place.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {residentServices.map(({ title, detail, icon: Icon }) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                  key={title}
                >
                  <Icon className="size-5 text-emerald-300" />
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <SectionLabel>For property owners</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Looking for reliable renters and better visibility?
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              CasaX helps property owners publish verified rentals, coordinate
              inspections, manage renter onboarding, and maintain clear rental
              records.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/property-owners">
                  Talk to CasaX <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/property-owners#assessment">
                  Request assessment
                </Link>
              </Button>
            </div>
          </div>
          <Card className="border-slate-200/80 p-6 shadow-sm">
            {[
              "CasaX-reviewed rentals",
              "Inspection coordination",
              "Renter onboarding",
              "Rent collection visibility",
              "Maintenance coordination",
            ].map((item) => (
              <p
                className="flex items-center gap-3 border-b border-slate-100 py-4 text-sm font-medium text-slate-700 last:border-0"
                key={item}
              >
                <CheckCircle2 className="size-5 text-emerald-600" />
                {item}
              </p>
            ))}
          </Card>
        </div>
      </section>
    </main>
  );
}

function HowCasaXVerifiesCard({ className = "" }: { className?: string }) {
  return (
    <Card
      className={`border-emerald-100 bg-[radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,#f8fafc,#ffffff)] p-6 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.4)] ${className}`}
    >
      <Badge className="border border-emerald-100 bg-white text-emerald-800">
        <ShieldCheck className="mr-1.5 size-3.5" />
        Verification process
      </Badge>
      <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-950">
        Why renters trust CasaX
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Every rental goes through a review process before it appears on CasaX.
      </p>
      <div className="mt-6 space-y-3">
        {[
          "Property information reviewed",
          "Unit photos checked",
          "Rent details prepared",
          "Inspection route available",
        ].map((item) => (
          <p
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            key={item}
          >
            <CheckCircle2 className="size-4 text-emerald-600" />
            {item}
          </p>
        ))}
      </div>
    </Card>
  );
}

function SearchField({
  name,
  placeholder,
}: {
  name: string;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <SlidersHorizontal className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}
