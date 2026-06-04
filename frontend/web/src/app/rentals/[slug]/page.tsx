import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Headphones,
  House,
  KeyRound,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Badge, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { RentalActions } from "@/components/rental-actions";
import { RentalGallery } from "@/components/rental-gallery";
import { getRentalBySlug } from "@/lib/rentals";

interface RentalDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RentalDetailPageProps): Promise<Metadata> {
  const rental = await getRentalBySlug((await params).slug).catch(() => null);
  if (!rental) {
    return { title: "Rental Not Found | CasaX" };
  }

  return {
    title: `${rental.title} | CasaX Rentals`,
    description: `${rental.propertyName}, ${rental.city}. Verified CasaX rental.`,
  };
}

export default async function RentalDetailPage({
  params,
}: RentalDetailPageProps) {
  const rental = await getRentalBySlug((await params).slug).catch(() => null);
  if (!rental) {
    notFound();
  }
  const galleryImages = rental.photos.length ? rental.photos : rental.media;
  const verifiedDate = rental.verifiedAt
    ? new Date(rental.verifiedAt).toLocaleDateString()
    : null;
  const description = cleanListingCopy(
    rental.description,
    "This CasaX-reviewed rental has prepared apartment details, inspection booking, and an online application flow.",
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8 lg:py-10">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          href="/rentals"
        >
          <ArrowLeft className="size-4" />
          Back to rentals
        </Link>

        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
          <div className="min-w-0">
            <RentalGallery
              images={galleryImages}
              propertyName={rental.propertyName}
              title={rental.title}
              unitName={rental.unitName}
              verifiedDate={verifiedDate}
            />

            <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.55)] sm:p-7">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="w-fit px-3 py-1.5">
                      {rental.availability}
                    </Badge>
                    <Badge className="border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-800">
                      CasaX-reviewed
                    </Badge>
                  </div>
                  <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                    {rental.title}
                  </h1>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="size-4 shrink-0" />
                    {rental.address}, {rental.city}, {rental.state}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 lg:text-right">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Annual rent
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">
                    {formatCurrency(rental.annualRent)}
                  </p>
                </div>
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: `${rental.bedrooms} bedrooms`, icon: BedDouble },
                  {
                    label: rental.bathrooms
                      ? `${rental.bathrooms} bathrooms`
                      : "Bathroom details pending",
                    icon: Bath,
                  },
                  { label: rental.unitType, icon: House },
                  { label: rental.inspectionAvailability, icon: CalendarDays },
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
            </div>

            <div className="mt-5 grid gap-5">
              <Card className="border-slate-200/70 bg-white shadow-none">
                <h2 className="text-lg font-semibold text-slate-950">
                  About this rental
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </Card>

              <Card className="border-slate-200/70 bg-white shadow-none">
                <h2 className="text-lg font-semibold text-slate-950">
                  Amenities
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(rental.amenities.length
                    ? rental.amenities
                    : ["Inspection-ready details", "CasaX-reviewed records"]
                  ).map((amenity) => (
                    <p
                      className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
                      key={amenity}
                    >
                      <ShieldCheck className="size-4 text-emerald-600" />
                      {amenity}
                    </p>
                  ))}
                </div>
              </Card>

              <div className="grid gap-5 md:grid-cols-2">
                <Card className="border-slate-200/70 bg-white shadow-none">
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
                <Card className="border-slate-200/70 bg-white shadow-none">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-emerald-700" />
                    <h2 className="font-semibold text-slate-950">
                      CasaX verification
                    </h2>
                  </div>
                  <p className="mt-5 text-sm font-medium text-slate-800">
                    Reviewed rental process
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Prepared from reviewed property information, apartment
                    details, and inspection-ready rental information.
                  </p>
                  <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
                    Inspection booking and applications are routed through
                    CasaX so renters have a structured next step.
                  </p>
                </Card>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Card className="border-slate-200/70 bg-white shadow-none">
                  <div className="flex items-center gap-3">
                    <Headphones className="size-5 text-emerald-700" />
                    <h2 className="font-semibold text-slate-950">
                      Resident support after move-in
                    </h2>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {[
                      "Rent records and payment history",
                      "Maintenance request coordination",
                      "Lease and renewal record support",
                    ].map((item) => (
                      <p
                        className="flex items-center gap-3 text-sm text-slate-600"
                        key={item}
                      >
                        <KeyRound className="size-4 text-emerald-600" />
                        {item}
                      </p>
                    ))}
                  </div>
                </Card>
                <Card className="border-slate-200/70 bg-white shadow-none">
                  <div className="flex items-center gap-3">
                    <MapPin className="size-5 text-emerald-700" />
                    <h2 className="font-semibold text-slate-950">Location</h2>
                  </div>
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="text-sm font-medium text-slate-800">
                      {rental.city}, {rental.state}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Exact inspection details are shared during CasaX
                      inspection coordination.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <aside className="xl:sticky xl:top-28">
            <Card className="h-fit border-slate-200/80 p-6 shadow-[0_20px_46px_-28px_rgba(15,23,42,0.32)]">
              <p className="text-sm text-slate-500">Annual rent</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {formatCurrency(rental.annualRent)}
              </p>
              <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm">
                <div className="flex justify-between gap-4 py-3">
                  <span className="text-slate-500">Service charge</span>
                  <span className="font-medium text-slate-800">
                    Confirmed at inspection
                  </span>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <span className="text-slate-500">Deposit</span>
                  <span className="font-medium text-slate-800">
                    Confirmed during application
                  </span>
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex gap-2 font-medium">
                  <BadgeCheck className="size-5 shrink-0" />
                  CasaX-reviewed rental
                </div>
                <p className="mt-2 leading-6 text-emerald-700">
                  Prepared through the CasaX review process before inspection.
                </p>
              </div>
              <div className="mt-7">
                <RentalActions rental={rental} layout="detail" />
              </div>
              <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                No agent handoff. CasaX coordinates the next step.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function cleanListingCopy(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed || /^(test|testing|sample)$/i.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}
