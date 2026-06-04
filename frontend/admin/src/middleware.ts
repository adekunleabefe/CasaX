import { NextRequest, NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.casax.ng";

function hasTemporaryAuthCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("access_token")?.value ||
      request.cookies.get("refresh_token")?.value,
  );
}

export function middleware(request: NextRequest) {
  if (hasTemporaryAuthCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/login", APP_URL);
  loginUrl.searchParams.set("next", "/dashboard");
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
