import Ajv from "ajv";

type ToolInputValidationIssue = {
  path: string;
  message: string;
};

export class ToolInputValidationError extends Error {
  constructor(public readonly issues: ToolInputValidationIssue[]) {
    super("tool input failed validation");
    this.name = "ToolInputValidationError";
  }
}

const MAX_COMPILED_VALIDATORS = 1_000;
const ajv = new Ajv({ allErrors: true, strict: false });
const compiledValidators = new Map<string, ReturnType<Ajv["compile"]>>();

function getCompiledValidator(schema: Record<string, unknown>) {
  const cacheKey = JSON.stringify(schema);
  const cached = compiledValidators.get(cacheKey);

  if (cached) {
    return cached;
  }

  const validator = ajv.compile(schema);
  compiledValidators.set(cacheKey, validator);

  if (compiledValidators.size > MAX_COMPILED_VALIDATORS) {
    const oldestCacheKey = compiledValidators.keys().next().value;

    if (oldestCacheKey !== undefined) {
      compiledValidators.delete(oldestCacheKey);
    }
  }

  return validator;
}

function issuePath(error: {
  instancePath: string;
  keyword: string;
  params: Record<string, unknown>;
}) {
  if (error.keyword === "required" && typeof error.params.missingProperty === "string") {
    return `${error.instancePath}/${error.params.missingProperty}`;
  }

  if (
    error.keyword === "additionalProperties" &&
    typeof error.params.additionalProperty === "string"
  ) {
    return `${error.instancePath}/${error.params.additionalProperty}`;
  }

  return error.instancePath || "/";
}

export function validateToolInput(
  schema: Record<string, unknown>,
  input: Record<string, unknown>,
): void {
  const validator = getCompiledValidator(schema);

  if (validator(input)) {
    return;
  }

  throw new ToolInputValidationError(
    (validator.errors ?? []).map((error) => ({
      path: issuePath(error),
      message: error.message ?? "validation failed",
    })),
  );
}
