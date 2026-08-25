export type PrErrorIssue = {
  path: string;
  message: string;
};

export type PrErrorOptions = {
  status?: number;
  code?: string;
  issues?: PrErrorIssue[];
  cause?: unknown;
};

export class PrError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly issues?: PrErrorIssue[];

  constructor(message: string, options: PrErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.status = options.status;
    this.code = options.code;
    this.issues = options.issues;
  }
}

export class PrAuthenticationError extends PrError {}

export class PrAuthorizationError extends PrError {}

export class PrNotFoundError extends PrError {}

export class PrValidationError extends PrError {}

export class PrRateLimitError extends PrError {
  readonly retryAfterMs?: number;

  constructor(message: string, options: PrErrorOptions & { retryAfterMs?: number } = {}) {
    super(message, options);
    this.retryAfterMs = options.retryAfterMs;
  }
}

export class PrConflictError extends PrError {}

export class PrServerError extends PrError {}

export class PrNetworkError extends PrError {}

export class PrTimeoutError extends PrError {}

export function createPrErrorForStatus(status: number, message: string, options: PrErrorOptions = {}): PrError {
  const errorOptions: PrErrorOptions = { ...options, status };

  if (status === 400) {
    return new PrValidationError(message, errorOptions);
  }

  if (status === 401) {
    return new PrAuthenticationError(message, errorOptions);
  }

  if (status === 403) {
    return new PrAuthorizationError(message, errorOptions);
  }

  if (status === 404) {
    return new PrNotFoundError(message, errorOptions);
  }

  if (status === 409) {
    return new PrConflictError(message, errorOptions);
  }

  if (status === 429) {
    return new PrRateLimitError(message, errorOptions);
  }

  if (status >= 500 && status <= 599) {
    return new PrServerError(message, errorOptions);
  }

  return new PrError(message, errorOptions);
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeIssues(value: unknown): PrErrorIssue[] | undefined {
  if (Array.isArray(value)) {
    const issues = value
      .filter(isRecord)
      .map((issue) => ({
        path: typeof issue.path === "string" ? issue.path : "",
        message: typeof issue.message === "string" ? issue.message : "validation failed",
      }))
      .filter((issue) => issue.path !== "" || issue.message !== "");

    return issues.length > 0 ? issues : undefined;
  }

  // zod flatten().fieldErrors shape: { field: ["message", ...] }
  if (isRecord(value)) {
    const issues: PrErrorIssue[] = [];

    for (const [path, messages] of Object.entries(value)) {
      if (Array.isArray(messages)) {
        for (const message of messages) {
          if (typeof message === "string") {
            issues.push({ path, message });
          }
        }
      }
    }

    return issues.length > 0 ? issues : undefined;
  }

  return undefined;
}

export type ParsedErrorBody = {
  message: string;
  code?: string;
  issues?: PrErrorIssue[];
};

export function parseErrorBody(body: unknown): ParsedErrorBody {
  let parsed: unknown = body;

  if (typeof body === "string") {
    try {
      parsed = JSON.parse(body);
    } catch {
      return { message: body };
    }
  }

  if (!isRecord(parsed)) {
    return { message: "request failed" };
  }

  const rawError = parsed.error;

  if (typeof rawError === "string") {
    return {
      message: rawError,
      code: typeof parsed.code === "string" ? parsed.code : undefined,
      issues: normalizeIssues(parsed.issues),
    };
  }

  if (isRecord(rawError)) {
    return {
      message: typeof rawError.message === "string" ? rawError.message : "request failed",
      code: typeof rawError.code === "string" ? rawError.code : undefined,
      issues: normalizeIssues(rawError.issues),
    };
  }

  if (typeof parsed.message === "string") {
    return { message: parsed.message };
  }

  return { message: "request failed" };
}
