"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowRight, Bookmark, CalendarDays } from "lucide-react";
import { Button } from "@casax/ui";
import {
  buildAuthContinuationUrl,
  captureAuthContinuation,
  type AuthContinuationIntent,
} from "@/lib/auth-continuation";
import {
  useCreateApplication,
  useCreateInspectionBooking,
  useCurrentApplicant,
  useSaveRental,
} from "@/lib/applicant-queries";
import type { VerifiedRental } from "@/lib/rentals";

type RentalActionLayout = "card" | "detail";

export function RentalActions({
  rental,
  layout = "card",
}: {
  rental: VerifiedRental;
  layout?: RentalActionLayout;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUser = useCurrentApplicant();
  const save = useSaveRental();
  const inspection = useCreateInspectionBooking();
  const application = useCreateApplication();
  const actionNotice = getActionNotice(searchParams.get("casaxAction"));
  const visibleNotice = notice ?? actionNotice;
  const busy =
    currentUser.isPending ||
    save.isPending ||
    inspection.isPending ||
    application.isPending;

  function currentPath() {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }

  function redirectToAccountAuth(intent: AuthContinuationIntent) {
    const next = currentPath();
    captureAuthContinuation({
      intent,
      next,
      rentalSlug: rental.slug,
      vacancyListingId: rental.vacancyListingId,
    });
    window.location.assign(
      buildAuthContinuationUrl({
        intent,
        next,
        rentalSlug: rental.slug,
        vacancyListingId: rental.vacancyListingId,
      }),
    );
  }

  function canUseAccountActions(intent: AuthContinuationIntent) {
    if (currentUser.data?.role === "applicant") return true;
    redirectToAccountAuth(intent);
    return false;
  }

  async function saveCurrentRental() {
    setNotice(null);
    if (!canUseAccountActions("save")) return;
    await save.mutateAsync(rental.vacancyListingId);
    setNotice("Rental saved to your CasaX account.");
  }

  async function bookInspection() {
    setNotice(null);
    if (!canUseAccountActions("inspection")) return;
    await inspection.mutateAsync({ vacancyListingId: rental.vacancyListingId });
    setNotice("Inspection request submitted.");
  }

  async function apply() {
    setNotice(null);
    if (!canUseAccountActions("apply")) return;
    await application.mutateAsync({
      propertyId: rental.propertyId,
      unitId: rental.unitId,
      vacancyListingId: rental.vacancyListingId,
      notes: "Application started from CasaX public rentals.",
    });
    setNotice("Application submitted. Track it from your account.");
  }

  if (layout === "detail") {
    return (
      <div className="space-y-3">
        <Button
          className="w-full rounded-xl"
          disabled={busy}
          onClick={() => void bookInspection()}
          type="button"
          variant="secondary"
        >
          <CalendarDays className="mr-2 size-4" />
          Book inspection
        </Button>
        <Button
          className="w-full rounded-xl"
          disabled={busy}
          onClick={() => void apply()}
          type="button"
        >
          Apply for this apartment
        </Button>
        <Button
          className="w-full rounded-xl"
          disabled={busy}
          onClick={() => void saveCurrentRental()}
          type="button"
          variant="outline"
        >
          <Bookmark className="mr-2 size-4" />
          Save rental
        </Button>
        {visibleNotice ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
            {visibleNotice}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      <Button className="w-full justify-between rounded-xl" variant="outline" asChild>
        <Link href={`/rentals/${rental.slug}`}>
          View details
          <ArrowRight className="size-4" />
        </Link>
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="rounded-xl px-2.5 text-xs"
          disabled={busy}
          onClick={() => void bookInspection()}
          type="button"
          variant="secondary"
        >
          <CalendarDays className="mr-1.5 size-3.5" />
          Book inspection
        </Button>
        <Button
          className="rounded-xl px-2.5 text-xs"
          disabled={busy}
          onClick={() => void apply()}
          type="button"
        >
          Apply now
        </Button>
      </div>
      <Button
        className="w-full rounded-xl px-2.5 text-xs"
        disabled={busy}
        onClick={() => void saveCurrentRental()}
        type="button"
        variant="ghost"
      >
        <Bookmark className="mr-1.5 size-3.5" />
        Save rental
      </Button>
      {visibleNotice ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          {visibleNotice}
        </p>
      ) : null}
    </div>
  );
}

function getActionNotice(action: string | null) {
  const messages: Record<string, string> = {
    save: "Rental saved.",
    inspection: "Inspection request submitted.",
    apply: "Application submitted.",
    continuation_failed:
      "You are signed in. Please try the rental action again from this page.",
  };
  return action ? messages[action] ?? null : null;
}
