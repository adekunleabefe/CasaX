const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/$/, "");

let authRecoveryInFlight = false;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly isAuthenticationError = status === 401,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isAuthRoute(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

export async function logoutRequest() {
  await fetch(`${apiBaseUrl}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  }).catch(() => undefined);
}

export async function recoverFromUnauthorized(error?: unknown) {
  if (typeof window === "undefined") return;
  if (error instanceof ApiError && !error.isAuthenticationError) return;
  if (authRecoveryInFlight || isAuthRoute(window.location.pathname)) return;

  authRecoveryInFlight = true;
  await logoutRequest();

  const loginUrl = new URL("/auth/sign-in", window.location.origin);
  loginUrl.searchParams.set("next", `${window.location.pathname}${window.location.search}`);
  window.location.replace(loginUrl.toString());
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit & { skipAuthRecovery?: boolean },
): Promise<T> {
  const { skipAuthRecovery, ...requestOptions } = options ?? {};
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...requestOptions.headers,
    },
  });
  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  if (response.status === 401) {
    const error = new ApiError(
      "Sign in to continue your CasaX rental request.",
      response.status,
      true,
    );
    if (!skipAuthRecovery) void recoverFromUnauthorized(error);
    throw error;
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? "The CasaX request could not be completed.",
      response.status,
    );
  }

  if (!payload) {
    throw new ApiError("The server returned an invalid response.", 500);
  }

  return payload.data;
}
