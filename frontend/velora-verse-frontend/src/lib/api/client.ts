const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://localhost:8002";
// When using API proxy (e.g. Cloudflare tunnels), browser requests use relative
// URLs so they go through Next.js rewrites (keeps cookies same-origin).
// Server-side (build/SSR) always uses absolute URL since there's no proxy.
const API_URL =
  process.env.NEXT_PUBLIC_USE_API_PROXY === "true" && typeof window !== "undefined"
    ? ""
    : FRAPPE_URL;

export class ApiError extends Error {
  constructor(
    public httpStatus: number,
    message: string,
    public serverMessages?: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let csrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_URL}/api/method/velora_verse.utils.get_csrf_token`, {
    credentials: "include",
  });
  if (!res.ok) {
    // If we can't get a CSRF token, return empty string.
    // Frappe skips CSRF validation when no token exists in the session.
    return "";
  }
  const data = await res.json();
  const token: string = data.message ?? "";
  csrfToken = token;
  return token;
}

export function clearCsrfToken() {
  csrfToken = null;
}

function parseErrorResponse(res: Response, errorData: Record<string, unknown>): { message: string; serverMessages: string[] } {
  let message = `Request failed with status ${res.status}`;
  let serverMessages: string[] = [];
  if (errorData._server_messages) {
    serverMessages = JSON.parse(errorData._server_messages as string).map((m: string) => {
      try { return JSON.parse(m).message; } catch { return m; }
    });
    message = serverMessages[0] || message;
  } else if (errorData.message) {
    message = errorData.message as string;
  } else if (errorData.exc_type) {
    message = errorData.exc_type as string;
  }
  return { message, serverMessages };
}

async function doFetch<T>(
  httpMethod: "GET" | "POST",
  url: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = {};
  let body: string | undefined;
  let fetchUrl = url;

  if (httpMethod === "GET") {
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
        }
      }
      fetchUrl += `?${searchParams.toString()}`;
    }
  } else {
    const token = await getCsrfToken();
    headers["X-Frappe-CSRF-Token"] = token;
    headers["Content-Type"] = "application/json";
    if (params) {
      body = JSON.stringify(params);
    }
  }

  const res = await fetch(fetchUrl, {
    method: httpMethod,
    headers,
    credentials: "include",
    body,
  });

  if (!res.ok) {
    let errorData: Record<string, unknown> = {};
    try { errorData = await res.json(); } catch {}

    // On 403, clear stale CSRF token and retry once with a fresh token
    if (res.status === 403 && httpMethod === "POST") {
      clearCsrfToken();
      const retryToken = await getCsrfToken();
      const retryHeaders: Record<string, string> = {
        "X-Frappe-CSRF-Token": retryToken,
        "Content-Type": "application/json",
      };
      const retryRes = await fetch(fetchUrl, {
        method: "POST",
        headers: retryHeaders,
        credentials: "include",
        body,
      });
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        return retryData.message as T;
      }
      // Retry also failed — parse the retry error
      clearCsrfToken();
      let retryErrorData: Record<string, unknown> = {};
      try { retryErrorData = await retryRes.json(); } catch {}
      const { message, serverMessages } = parseErrorResponse(retryRes, retryErrorData);
      throw new ApiError(retryRes.status, message, serverMessages);
    }

    if (res.status === 403) {
      clearCsrfToken();
    }
    const { message, serverMessages } = parseErrorResponse(res, errorData);
    throw new ApiError(res.status, message, serverMessages);
  }

  const data = await res.json();
  return data.message as T;
}

export async function frappeCall<T = unknown>(
  method: string,
  params?: Record<string, unknown>,
  options?: { method?: "GET" | "POST" }
): Promise<T> {
  const httpMethod = options?.method || "POST";
  const url = `${API_URL}/api/method/${method}`;
  return doFetch<T>(httpMethod, url, params);
}

// Helper for server-side calls (no CSRF needed for GET)
export async function frappeGet<T = unknown>(
  method: string,
  params?: Record<string, unknown>
): Promise<T> {
  return frappeCall<T>(method, params, { method: "GET" });
}

export function getFrappeUrl(): string {
  return FRAPPE_URL;
}
