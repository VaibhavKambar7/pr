import { RuntimeResource } from "./resources/runtime.js";
import type { RequestContext } from "./http.js";

const DEFAULT_BASE_URL = "http://localhost:3001";
const DEFAULT_TIMEOUT_MS = 10_000;

export type PrClientOptions = {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
};

function resolveFetch(customFetch: typeof fetch | undefined): typeof fetch {
  if (customFetch) {
    return customFetch.bind(globalThis);
  }

  if (typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis);
  }

  throw new Error("`fetch` is not available. Pass a custom fetch implementation via `PrClientOptions.fetch`.");
}

function validateOptions(options: PrClientOptions): void {
  if (typeof options.apiKey !== "string" || options.apiKey.trim() === "") {
    throw new Error("`apiKey` must be a non-empty string");
  }

  if (typeof options.projectId !== "string" || options.projectId.trim() === "") {
    throw new Error("`projectId` must be a non-empty string");
  }

  if (options.baseUrl !== undefined && (typeof options.baseUrl !== "string" || options.baseUrl.trim() === "")) {
    throw new Error("`baseUrl` must be a non-empty string when provided");
  }

  if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
    throw new Error("`timeoutMs` must be a positive finite number when provided");
  }
}

export class PrClient {
  readonly runtime: RuntimeResource;

  private readonly context: RequestContext;

  constructor(options: PrClientOptions) {
    validateOptions(options);

    this.context = {
      baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
      apiKey: options.apiKey,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      fetchImpl: resolveFetch(options.fetch),
    };

    this.runtime = new RuntimeResource(this.context, options.projectId);
  }
}
