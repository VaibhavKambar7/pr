import {
  PrNetworkError,
  PrTimeoutError,
  createPrErrorForStatus,
  parseErrorBody,
} from "./errors.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  query?: Record<string, string | undefined>;
  body?: unknown;
  signal?: AbortSignal;
};

export type RequestContext = {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  fetchImpl: typeof fetch;
};

function buildUrl(baseUrl: string, path: string, query: Record<string, string | undefined> | undefined): string {
  const url = new URL(path, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

function createAbortError(externalSignal: AbortSignal | undefined): unknown {
  const reason = externalSignal?.reason;

  if (reason !== undefined) {
    return reason;
  }

  return new DOMException("This operation was aborted", "AbortError");
}

function bindExternalSignal(
  externalSignal: AbortSignal | undefined,
  controller: AbortController,
): () => void {
  if (!externalSignal) {
    return () => {};
  }

  const listener = () => controller.abort();
  externalSignal.addEventListener("abort", listener, { once: true });

  return () => externalSignal.removeEventListener("abort", listener);
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text === "") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(
  context: RequestContext,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { baseUrl, apiKey, timeoutMs, fetchImpl } = context;
  const method = options.method ?? "GET";
  const url = buildUrl(baseUrl, path, options.query);

  if (options.signal?.aborted) {
    throw createAbortError(options.signal);
  }

  // Combine the caller's signal with our own timeout without relying solely on
  // AbortSignal.timeout(), so caller cancellation still works.
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const unbindExternalSignal = bindExternalSignal(options.signal, controller);

  try {
    let response: Response;
    let responseBody: unknown;

    try {
      response = await fetchImpl(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      responseBody = await readResponseBody(response);
    } catch (error) {
      if (timedOut) {
        throw new PrTimeoutError(`request timed out after ${timeoutMs}ms`);
      }

      if (options.signal?.aborted) {
        throw createAbortError(options.signal);
      }

      throw new PrNetworkError("network request failed", { cause: error });
    }

    if (!response.ok) {
      const parsed = parseErrorBody(responseBody);

      throw createPrErrorForStatus(response.status, parsed.message, {
        code: parsed.code,
        issues: parsed.issues,
        ...(response.status === 429 ? { retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")) } : {}),
      });
    }

    return responseBody as T;
  } finally {
    clearTimeout(timeoutId);
    unbindExternalSignal();
  }
}

function parseRetryAfterMs(headerValue: string | null): number | undefined {
  if (headerValue === null) {
    return undefined;
  }

  const seconds = Number(headerValue);

  if (!Number.isFinite(seconds)) {
    return undefined;
  }

  return Math.max(seconds * 1000, 0);
}
