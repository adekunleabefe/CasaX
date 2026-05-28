import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  Bookmark,
  Building2,
  CalendarDays,
  House,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Badge, Button, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { getRentalBySlug, verifiedRentals } from "@/lib/rentals";

interface RentalDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return verifiedRentals.map((rental) => ({ slug: rental.slug }));
}

export async function generateMetadata({
  params,
}: RentalDetailPageProps): Promise<Metadata> {
  const rental = getRentalBySlug((await params).slug);
  if (!rental) {
    return { title: "Rental Not Found | CasaX" };
  }

  return {
    title: `${rental.title} | CasaX Rentals`,
    description: `${rental.propertyName}, ${rental.city}. Verified CasaX rental vacancy.`,
  };
}

export default async function RentalDetailPage({
  params,
}: RentalDetailPageProps) {
  const rental = getRentalBySlug((await params).slug);
  if (!rental) {
    notFound();
  }

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8 lg:py-12">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          href="/rentals"
        >
          <ArrowLeft className="size-4" />
          Back to rentals
        </Link>

        <div className="mt-7 grid gap-7 lg:mt-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <div
                className={`relative min-h-[290px] overflow-hidden rounded-3xl bg-gradient-to-br ${rental.accent} p-7 text-white shadow-[0_25px_65px_-38px_rgba(15,23,42,0.6)] sm:min-h-[394px] sm:p-10`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_22%,rgba(16,185,129,0.34),transparent_30%),radial-gradient(circle_at_25%_78%,rgba(255,255,255,0.07),transparent_34%)]" />
                <div className="relative flex justify-between gap-4">
                  <Badge className="bg-white/10 text-white ring-1 ring-white/20">
                    <BadgeCheck className="mr-1.5 size-3.5 text-emerald-300" />
                    Verified rental
                  </Badge>
                  <p className="text-xs text-slate-300">{rental.verifiedAt}</p>
                </div>
                <div className="absolute bottom-7 left-7 right-7 sm:bottom-10 sm:left-10">
                  <p className="text-sm text-slate-300">
                    {rental.propertyName}
                  </p>
                  <p className="mt-2 text-2xl font-semibold sm:text-3xl">
                    {rental.unitName}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                {rental.media.map((label, index) => (
                  <div
                    className={`flex min-h-24 items-end rounded-2xl bg-gradient-to-br p-3 text-xs font-medium text-white ${
                      index % 2 === 0
                        ? "from-slate-900 to-slate-700"
                        : "from-slate-800 to-emerald-900"
                    }`}
                    key={label}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                    {rental.title}
                  </h1>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="size-4 shrink-0" />
                    {rental.address}, {rental.city}, {rental.state}
                  </p>
                </div>
                <Badge className="w-fit px-4 py-2">{rental.availability}</Badge>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { label: `${rental.bedrooms} bedrooms`, icon: BedDouble },
                  { label: `${rental.bathrooms} bathrooms`, icon: Bath },
                  { label: rental.unitType, icon: House },
                ].map(({ label, icon: Icon }) => (
                  <div
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                    key={label}
                  >
                    <Icon className="size-4 text-slate-500" />
                    {label}
                  </div>
                ))}
              </div>
              <Card className="mt-8 border-slate-200/70 shadow-none">
                <h2 className="font-semibold text-slate-950">
                  About this rental
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {rental.description}
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {rental.amenities.map((amenity) => (
                    <p
                      className="flex items-center gap-2 text-sm text-slate-600"
                      key={amenity}
                    >
                      <ShieldCheck className="size-4 text-emerald-600" />
                      {amenity}
                    </p>
                  ))}
                </div>
              </Card>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Card className="border-slate-200/70 shadow-none">
                  <div className="flex items-center gap-3">
                    <Building2 className="size-5 text-emerald-700" />
                    <h2 className="font-semibold text-slate-950">
                      Property information
                    </h2>
                  </div>
                  <dl className="mt-5 space-y-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Property</dt>
                      <dd className="font-medium text-slate-800">
                        {rental.propertyName}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Type</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {rental.propertyType}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Managed units</dt>
                      <dd className="font-medium text-slate-800">
                        {rental.propertyUnits}
                      </dd>
                    </div>
                  </dl>
                </Card>
                <Card className="border-slate-200/70 shadow-none">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-emerald-700" />
                    <h2 className="font-semibold text-slate-950">
                      Management trust
                    </h2>
                  </div>
                  <p className="mt-5 text-sm font-medium text-slate-800">
                    {rental.managedBy}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {rental.managerSince}
                  </p>
                  <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
                    Vacancy status and application workflow verified through
                    CasaX.
                  </p>
                </Card>
              </div>
            </div>
          </div>

          <Card className="h-fit border-slate-200/80 p-6 shadow-[0_20px_46px_-28px_rgba(15,23,42,0.32)] lg:sticky lg:top-28">
            <p className="text-sm text-slate-500">Annual rent</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {formatCurrency(rental.annualRent)}
            </p>
            <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex gap-2 font-medium">
                <BadgeCheck className="size-5 shrink-0" />
                Vacancy verified through CasaX
              </div>
              <p className="mt-2 leading-6 text-emerald-700">
                Published from an active managed unit record.
              </p>
            </div>
            <div className="mt-7 space-y-3">
              <Button className="w-full rounded-xl" variant="secondary" asChild>
                <Link href={`/auth?intent=inspection&rental=${rental.slug}`}>
                  <CalendarDays className="mr-2 size-4" />
                  Book inspection
                </Link>
              </Button>
              <Button className="w-full rounded-xl" asChild>
                <Link href={`/auth?intent=apply&rental=${rental.slug}`}>
                  Apply now
                </Link>
              </Button>
              <Button className="w-full rounded-xl" variant="outline" asChild>
                <Link href={`/auth?intent=save&rental=${rental.slug}`}>
                  <Bookmark className="mr-2 size-4" />
                  Save rental
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
