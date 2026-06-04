import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bath,
  BedDouble,
  Bookmark,
  Home,
  MapPin,
} from "lucide-react";
import { Badge, Card } from "@casax/ui";
import { formatCurrency } from "@casax/utils";
import { RentalImage } from "@/components/rental-image";
import { RentalActions } from "@/components/rental-actions";
import type { VerifiedRental } from "@/lib/rentals";

export function RentalCard({
  rental,
  showActions = false,
}: {
  rental: VerifiedRental;
  showActions?: boolean;
}) {
  const coverImage = rental.photos[0] ?? rental.media[0];
  const isPreview = Boolean(rental.isPreview);

  return (
    <Card className="group overflow-hidden border-slate-200/80 p-0 shadow-[0_10px_35px_-26px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-28px_rgba(15,23,42,0.32)]">
      <div
        className={`relative h-56 bg-gradient-to-br ${rental.accent} p-5 text-white sm:h-60`}
      >
        <RentalImage
          alt={`${rental.title} cover photo`}
          className="absolute inset-0 h-full w-full object-cover"
          src={coverImage}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/45 to-slate-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(16,185,129,0.3),transparent_32%)]" />
        <div className="relative flex justify-between gap-3">
          <Badge className="bg-white/15 text-white ring-1 ring-white/20 backdrop-blur">
            <BadgeCheck className="mr-1.5 size-3.5 text-emerald-300" />
            {isPreview ? "Preview Apartment" : "Verified"}
          </Badge>
          <button
            aria-label="Save rental"
            className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25"
            type="button"
          >
            <Bookmark className="size-4" />
          </button>
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-xs font-medium text-slate-200">
            {rental.propertyName}
          </p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-lg font-semibold leading-6">{rental.unitName}</p>
            <p className="shrink-0 rounded-full bg-slate-950/35 px-3 py-1 text-xs text-white backdrop-blur">
              {rental.availability}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="line-clamp-2 text-lg font-semibold leading-6 text-slate-950">
          {rental.title}
        </h3>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="size-4" />
          {rental.city}, {rental.state}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <BedDouble className="size-3.5 text-slate-500" />
            {rental.bedrooms} beds
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="size-3.5 text-slate-500" />
            {rental.bathrooms ?? "—"} baths
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <Home className="size-3.5 text-slate-500" />
            {rental.unitType}
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-5">
          <div>
            <p className="text-lg font-semibold text-slate-950">
              {formatCurrency(rental.annualRent)}
            </p>
            <p className="text-xs text-slate-500">per year</p>
          </div>
          <p className="text-xs font-medium text-emerald-700">
            CasaX-reviewed
          </p>
        </div>
        {isPreview ? (
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            Preview apartment
          </div>
        ) : showActions ? (
          <RentalActions rental={rental} />
        ) : (
          <Link
            className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition group-hover:bg-slate-950 group-hover:text-white"
            href={`/rentals/${rental.slug}`}
          >
            View rental
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </Card>
  );
}
