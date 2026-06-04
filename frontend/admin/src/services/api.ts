const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

let authRecoveryInFlight = false;

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

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

export async function logoutRequest() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  }).catch(() => undefined);
}

export async function recoverFromUnauthorized(error?: unknown) {
  if (typeof window === "undefined") return;
  if (error instanceof ApiError && !error.isAuthenticationError) return;
  if (authRecoveryInFlight) return;

  authRecoveryInFlight = true;
  await logoutRequest();

  const loginUrl = new URL("/auth/login", APP_URL);
  loginUrl.searchParams.set("next", "/dashboard");
  window.location.replace(loginUrl.toString());
}

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (response.status === 401) {
    const error = new ApiError(
      "Your admin session has expired. Please sign in again.",
      response.status,
      true,
    );
    void recoverFromUnauthorized(error);
    throw error;
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? "CasaX admin request failed",
      response.status,
    );
  }

  return payload?.data as T;
}

export async function apiFormRequest<T>(path: string, body: FormData) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body,
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (response.status === 401) {
    const error = new ApiError(
      "Your admin session has expired. Please sign in again.",
      response.status,
      true,
    );
    void recoverFromUnauthorized(error);
    throw error;
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? "CasaX admin upload failed",
      response.status,
    );
  }

  return payload?.data as T;
}
