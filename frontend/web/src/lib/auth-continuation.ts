import { createInspectionBooking, saveRental } from "@/lib/applicant";
import { apiRequest } from "@/lib/api";
import { createApplication } from "@/lib/applications";
import type { VerifiedRental } from "@/lib/rentals";

export type AuthContinuationIntent = "save" | "inspection" | "apply";
export type AuthContinuation = {
  intent: AuthContinuationIntent | null;
  next: string;
  rentalSlug: string | null;
  vacancyListingId: string | null;
};

const keys = {
  intent: "casax.auth.intent",
  next: "casax.auth.next",
  rentalSlug: "casax.auth.rentalSlug",
  vacancyListingId: "casax.auth.vacancyListingId",
};

const intentLabels: Record<AuthContinuationIntent, string> = {
  save: "Rental saved.",
  inspection: "Inspection request submitted.",
  apply: "Application submitted.",
};

export function isAuthContinuationIntent(
  value: string | null,
): value is AuthContinuationIntent {
  return value === "save" || value === "inspection" || value === "apply";
}

export function captureAuthContinuation(input: {
  intent?: string | null;
  next?: string | null;
  rentalSlug?: string | null;
  vacancyListingId?: string | null;
}) {
  if (typeof window === "undefined") return;
  const intent = input.intent ?? null;
  if (input.next && isSafePath(input.next)) {
    window.sessionStorage.setItem(keys.next, input.next);
  }
  if (isAuthContinuationIntent(intent)) {
    window.sessionStorage.setItem(keys.intent, intent);
  }
  if (input.rentalSlug) {
    window.sessionStorage.setItem(keys.rentalSlug, input.rentalSlug);
  }
  if (input.vacancyListingId) {
    window.sessionStorage.setItem(keys.vacancyListingId, input.vacancyListingId);
  }
}

export function getContinuationFromQuery(input: {
  intent?: string | null;
  next?: string | null;
  rentalSlug?: string | null;
  vacancyListingId?: string | null;
}): AuthContinuation | null {
  const intent = input.intent ?? null;
  const next = safePath(input.next ?? null, "/rentals");
  const hasContinuation =
    isAuthContinuationIntent(intent) ||
    Boolean(input.rentalSlug) ||
    Boolean(input.vacancyListingId);

  if (!hasContinuation) return null;

  return {
    intent: isAuthContinuationIntent(intent) ? intent : null,
    next,
    rentalSlug: input.rentalSlug ?? null,
    vacancyListingId: input.vacancyListingId ?? null,
  };
}

export function saveContinuation(continuation: AuthContinuation | null) {
  if (!continuation) return;
  captureAuthContinuation(continuation);
}

export function buildAuthContinuationUrl(input: {
  intent: AuthContinuationIntent;
  rentalSlug: string;
  vacancyListingId: string;
  next: string;
}) {
  const path = input.intent === "save" ? "/auth/sign-in" : "/auth/sign-up";
  const query = new URLSearchParams({
    intent: input.intent,
    next: input.next,
    rentalSlug: input.rentalSlug,
    vacancyListingId: input.vacancyListingId,
  });
  return `${path}?${query.toString()}`;
}

export async function completeAuthContinuation(defaultPath = "/rentals") {
  if (typeof window === "undefined") {
    return { redirectTo: defaultPath };
  }

  const continuation = consumeContinuation(defaultPath);
  const intent = continuation.intent;
  const next = continuation.next;
  const rentalSlug = continuation.rentalSlug;
  const vacancyListingId = continuation.vacancyListingId;

  if (!intent) {
    return { redirectTo: next };
  }

  try {
    const rental = await resolveRental({ rentalSlug, vacancyListingId });
    if (!rental) {
      return { redirectTo: withActionNotice(next, "continuation_failed") };
    }

    if (intent === "save") {
      await saveRental(rental.vacancyListingId);
    }

    if (intent === "inspection") {
      await createInspectionBooking({ vacancyListingId: rental.vacancyListingId });
    }

    if (intent === "apply") {
      await createApplication({
        propertyId: rental.propertyId,
        unitId: rental.unitId,
        vacancyListingId: rental.vacancyListingId,
        notes: "Application continued after CasaX account sign-in.",
      });
    }

    return {
      redirectTo: withActionNotice(next, intent),
      message: intentLabels[intent],
    };
  } catch {
    return {
      redirectTo: withActionNotice(next, "continuation_failed"),
      message: "We could not complete that action automatically.",
    };
  } finally {
    clearAuthContinuation();
  }
}

export function consumeContinuation(defaultPath = "/rentals"): AuthContinuation {
  if (typeof window === "undefined") {
    return {
      intent: null,
      next: defaultPath,
      rentalSlug: null,
      vacancyListingId: null,
    };
  }

  const intent = window.sessionStorage.getItem(keys.intent);
  return {
    intent: isAuthContinuationIntent(intent) ? intent : null,
    next: safePath(window.sessionStorage.getItem(keys.next), defaultPath),
    rentalSlug: window.sessionStorage.getItem(keys.rentalSlug),
    vacancyListingId: window.sessionStorage.getItem(keys.vacancyListingId),
  };
}

export function clearAuthContinuation() {
  if (typeof window === "undefined") return;
  Object.values(keys).forEach((key) => window.sessionStorage.removeItem(key));
}

function withActionNotice(path: string, intent: AuthContinuationIntent | "continuation_failed") {
  const url = new URL(path, window.location.origin);
  url.searchParams.set("casaxAction", intent);
  return `${url.pathname}${url.search}`;
}

async function resolveRental(input: {
  rentalSlug: string | null;
  vacancyListingId: string | null;
}) {
  if (input.rentalSlug) {
    return apiRequest<VerifiedRental>(`/public/rentals/${input.rentalSlug}`, {
      skipAuthRecovery: true,
    });
  }
  return input.vacancyListingId
    ? ({ vacancyListingId: input.vacancyListingId } as VerifiedRental)
    : null;
}

function safePath(value: string | null, fallback: string) {
  return value && isSafePath(value) ? value : fallback;
}

function isSafePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}
