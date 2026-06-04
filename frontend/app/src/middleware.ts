import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/rent",
  "/agreement",
  "/documents",
  "/notifications",
  "/support",
  "/portfolio",
  "/properties",
  "/units",
  "/applications",
  "/occupancy",
  "/tenancies",
  "/caretakers",
  "/subscription",
  "/payments",
  "/remittances",
  "/maintenance",
  "/reports",
  "/vacancies",
  "/settings",
  "/tenant-onboarding-requests",
];

const publicAuthRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/setup-account",
  "/auth/verify-email",
];

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function hasTemporaryAuthCookie(request: NextRequest) {
  // Temporary guard: replace with backend session validation when it is fully wired.
  return Boolean(
    request.cookies.get("access_token")?.value ||
    request.cookies.get("refresh_token")?.value,
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isRoot = pathname === "/";
  const isProtected = protectedPrefixes.some((route) =>
    matchesRoute(pathname, route),
  );
  const isPublicAuthRoute = publicAuthRoutes.some((route) =>
    matchesRoute(pathname, route),
  );

  if (!isRoot && !isProtected && !isPublicAuthRoute) {
    return NextResponse.next();
  }

  const authenticated = hasTemporaryAuthCookie(request);

  if (authenticated && isRoot) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!authenticated && (isRoot || isProtected)) {
    const loginUrl = new URL("/auth/login", request.url);

    if (!isRoot) {
      loginUrl.searchParams.set("next", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/rent/:path*",
    "/agreement/:path*",
    "/documents/:path*",
    "/notifications/:path*",
    "/support/:path*",
    "/portfolio/:path*",
    "/properties/:path*",
    "/units/:path*",
    "/applications/:path*",
    "/occupancy/:path*",
    "/tenancies/:path*",
    "/caretakers/:path*",
    "/subscription/:path*",
    "/payments/:path*",
    "/remittances/:path*",
    "/maintenance/:path*",
    "/reports/:path*",
    "/vacancies/:path*",
    "/settings/:path*",
    "/tenant-onboarding-requests/:path*",
    "/auth/:path*",
  ],
};
