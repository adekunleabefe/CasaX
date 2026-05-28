import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BanknoteArrowDown,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileWarning,
  House,
  KeyRound,
  ReceiptText,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Badge, Button, Card } from "@casax/ui";
import { RentalCard } from "@/components/rental-card";
import { verifiedRentals } from "@/lib/rentals";

const trustValues = [
  { title: "Occupancy visibility", icon: Eye },
  { title: "Caretaker accountability", icon: ShieldCheck },
  { title: "Rent transparency", icon: ReceiptText },
  { title: "Verified vacancies", icon: BadgeCheck },
];

const painPoints = [
  {
    title: "Scattered records",
    detail:
      "Paper files and chat histories make portfolio truth difficult to retrieve.",
    icon: FileWarning,
  },
  {
    title: "Caretaker opacity",
    detail:
      "Assignments and on-site updates are hard to verify from a distance.",
    icon: UsersRound,
  },
  {
    title: "Hidden rent collection",
    detail:
      "Collection and remittance timelines become impossible to reconcile.",
    icon: BanknoteArrowDown,
  },
  {
    title: "Unknown occupants",
    detail: "Landlords lack a reliable live record of who is inside each unit.",
    icon: KeyRound,
  },
  {
    title: "Vacancy confusion",
    detail:
      "Published availability can drift from the true status of the unit.",
    icon: House,
  },
];

const workflow = [
  "Landlord",
  "Property",
  "Units",
  "Caretaker",
  "Applicant",
  "Tenant",
  "Payments",
];

const features = [
  {
    title: "Property & unit management",
    detail:
      "Organize each building and unit with accurate availability and occupancy status.",
    icon: Building2,
  },
  {
    title: "Caretaker monitoring",
    detail:
      "Assign caretakers by property and keep activity tied to clear responsibility.",
    icon: UsersRound,
  },
  {
    title: "Applicant approvals",
    detail:
      "Review applications and convert only approved applicants into tenants.",
    icon: UserRoundCheck,
  },
  {
    title: "Rent and remittance tracking",
    detail:
      "Separate collected payments from amounts still due to each landlord.",
    icon: ReceiptText,
  },
  {
    title: "Maintenance requests",
    detail:
      "Capture issues, ownership, progress, and resolution across occupied units.",
    icon: Wrench,
  },
  {
    title: "Optional vacancy publishing",
    detail:
      "Publish real vacant units directly to applicants only when you choose.",
    icon: BadgeCheck,
  },
];

const plans = [
  {
    name: "Starter",
    price: "₦10k",
    detail: "For individual landlords establishing visibility.",
    benefits: ["Up to 3 properties", "Up to 20 units", "1 caretaker"],
  },
  {
    name: "Growth",
    price: "₦25k",
    detail: "For growing portfolios needing operating control.",
    benefits: ["Up to 10 properties", "Up to 100 units", "Vacancy publishing"],
    featured: true,
  },
  {
    name: "Business",
    price: "Custom",
    detail: "For scaled operators and tailored workflows.",
    benefits: [
      "Unlimited properties",
      "Enterprise features",
      "Priority support",
    ],
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
      {children}
    </p>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative isolate scroll-mt-20" id="landlords">
        <div className="absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(circle_at_72%_18%,rgba(16,185,129,0.13),transparent_32%),radial-gradient(circle_at_30%_0%,rgba(148,163,184,0.2),transparent_38%),linear-gradient(to_bottom,#f8fafc,white)]" />
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-12 sm:pb-16 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-7 border border-emerald-100 bg-white px-4 py-2 shadow-sm">
              Built for accountable property operations
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-[4.5rem] lg:leading-[1.08]">
              Know who occupies your property and where your rent is going.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              CasaX helps landlords manage units, monitor caretakers, track
              rent, and publish real vacancies directly to applicants.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row">
              <Button
                className="rounded-full bg-slate-950 px-7 py-3.5 text-white shadow-[0_14px_36px_-14px_rgba(15,23,42,0.75)] hover:bg-slate-800"
                asChild
              >
                <Link href="https://app.casax.ng/auth/register">
                  Start free trial <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                className="rounded-full px-7 py-3.5"
                variant="outline"
                asChild
              >
                <Link href="/rentals">Browse rentals</Link>
              </Button>
            </div>
          </div>

          <div className="mt-14 scroll-mt-24 lg:mt-20" id="product">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-slate-200/80 px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:px-8">
          {trustValues.map(({ title, icon: Icon }) => (
            <div
              className="flex items-center gap-4 py-7 sm:px-6 first:sm:pl-0"
              key={title}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon className="size-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">{title}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 sm:py-20 lg:px-8 lg:py-28"
        id="rentals"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <SectionLabel>Verified rentals</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Verified rentals from active landlords
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Browse real vacancies managed through CasaX operations.
            </p>
          </div>
          <Button className="w-fit rounded-full" variant="outline" asChild>
            <Link href="/rentals">
              View all rentals <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {verifiedRentals.map((rental) => (
            <RentalCard key={rental.slug} rental={rental} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <SectionLabel>Why CasaX</SectionLabel>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Operating properties should not depend on partial information.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            When records, collections, and vacancy updates live in different
            places, landlords lose visibility exactly when decisions matter
            most.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {painPoints.map(({ title, detail, icon: Icon }) => (
            <Card
              className="group border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-[0_20px_36px_-24px_rgba(15,23,42,0.28)]"
              key={title}
            >
              <Icon className="size-5 text-orange-500" />
              <h3 className="mt-5 font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[360px_1fr] lg:items-center">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Connected workflow
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                One operational record from ownership to payment.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-400">
                Applicants become tenants only after approval, payment
                confirmation, unit assignment, and tenancy creation.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {workflow.map((step, index) => (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
                  key={step}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-semibold text-emerald-300">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{step}</span>
                  {index < workflow.length - 1 && (
                    <ChevronRight className="ml-auto hidden size-4 text-slate-600 xl:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8 lg:py-28"
        id="features"
      >
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Platform capabilities</SectionLabel>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Everything needed to operate a rental portfolio with confidence.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, detail, icon: Icon }) => (
            <Card
              className="border-slate-200/70 p-6 shadow-[0_8px_28px_-20px_rgba(15,23,42,0.24)]"
              key={title}
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-950">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section
        className="scroll-mt-20 border-y border-slate-200/70 bg-slate-50 py-16 sm:py-20 lg:py-28"
        id="pricing"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Start small. Scale with your portfolio.
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                className={
                  plan.featured
                    ? "relative border-slate-950 bg-slate-950 p-7 text-white shadow-[0_26px_60px_-28px_rgba(15,23,42,0.7)]"
                    : "p-7 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.2)]"
                }
                key={plan.name}
              >
                {plan.featured && (
                  <span className="absolute right-6 top-6 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    Most popular
                  </span>
                )}
                <p
                  className={
                    plan.featured ? "text-slate-300" : "text-slate-500"
                  }
                >
                  {plan.name}
                </p>
                <p className="mt-5 text-4xl font-semibold tracking-tight">
                  {plan.price}
                  {plan.price !== "Custom" && (
                    <span
                      className={`ml-1 text-sm font-normal ${
                        plan.featured ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      /month
                    </span>
                  )}
                </p>
                <p
                  className={`mt-4 min-h-12 text-sm leading-6 ${
                    plan.featured ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {plan.detail}
                </p>
                <ul className="mt-8 space-y-4 text-sm">
                  {plan.benefits.map((benefit) => (
                    <li className="flex items-center gap-3" key={benefit}>
                      <Check
                        className={`size-4 ${
                          plan.featured
                            ? "text-emerald-300"
                            : "text-emerald-600"
                        }`}
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-9 w-full rounded-full ${
                    plan.featured
                      ? "bg-white text-slate-950 hover:bg-slate-100"
                      : "border-slate-200"
                  }`}
                  variant={plan.featured ? "primary" : "outline"}
                  asChild
                >
                  <Link href="https://app.casax.ng/auth/register">
                    {plan.price === "Custom"
                      ? "Contact sales"
                      : "Start free trial"}
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] bg-slate-950 px-5 py-12 text-center text-white sm:rounded-[2rem] sm:px-12 sm:py-16 lg:py-20">
          <div className="absolute left-1/2 top-0 h-56 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Bring visibility and control to your property operations.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300">
              Give every unit, collection, applicant, and caretaker action a
              clear operational record.
            </p>
            <Button
              className="mt-9 rounded-full bg-emerald-500 px-7 py-3.5 text-white hover:bg-emerald-400"
              asChild
            >
              <Link href="https://app.casax.ng/auth/register">
                Start free trial <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardPreview() {
  const metrics = [
    {
      label: "Occupied units",
      value: "87",
      note: "+4 this month",
      accent: "text-emerald-600",
    },
    {
      label: "Vacant units",
      value: "12",
      note: "5 published",
      accent: "text-slate-950",
    },
    {
      label: "Pending approvals",
      value: "06",
      note: "Needs review",
      accent: "text-orange-600",
    },
    {
      label: "Pending remittance",
      value: "₦1.24m",
      note: "3 collections",
      accent: "text-slate-950",
    },
  ];

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="absolute inset-x-16 -bottom-7 h-24 rounded-full bg-slate-950/10 blur-3xl" />
      <Card className="relative overflow-hidden border-slate-200/80 bg-white p-2 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.3)] sm:p-3">
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-slate-200" />
              <span className="size-2.5 rounded-full bg-slate-200" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            <p className="hidden text-xs font-medium text-slate-400 sm:block">
              app.casax.ng / dashboard
            </p>
            <Badge className="px-2.5 py-1">Live status</Badge>
          </div>
          <div className="grid md:grid-cols-[190px_1fr]">
            <div className="hidden border-r border-slate-200 bg-white p-5 md:block">
              <p className="mb-7 text-sm font-semibold text-slate-950">
                CasaX Workspace
              </p>
              {[
                "Overview",
                "Properties",
                "Applications",
                "Payments",
                "Maintenance",
              ].map((label, index) => (
                <div
                  className={`mb-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                    index === 0 ? "bg-slate-950 text-white" : "text-slate-500"
                  }`}
                  key={label}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Portfolio overview</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950 sm:text-xl">
                    Operations dashboard
                  </p>
                </div>
                <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-slate-500 shadow-sm sm:flex">
                  <Activity className="size-3.5 text-emerald-600" />
                  Updated now
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {metrics.map((metric) => (
                  <div
                    className="rounded-xl border border-slate-200/70 bg-white p-3.5 sm:p-4"
                    key={metric.label}
                  >
                    <p className="text-[11px] leading-4 text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950 sm:text-2xl">
                      {metric.value}
                    </p>
                    <p
                      className={`mt-2 text-[11px] font-medium ${metric.accent}`}
                    >
                      {metric.note}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_240px]">
                <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-medium text-slate-800">
                      Rent remittance status
                    </p>
                    <p className="text-slate-400">May 2026</p>
                  </div>
                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[78%] rounded-full bg-emerald-500" />
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-slate-500">
                    <p>₦4.46m received</p>
                    <p className="text-orange-600">₦1.24m pending</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                  <p className="text-xs font-medium text-slate-800">
                    Recent activity
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <ClipboardCheck className="size-4 text-emerald-600" />
                    New applicant review
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <BadgeCheck className="size-4 text-emerald-600" />
                    Vacancy verified
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
