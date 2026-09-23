import Ajv from "ajv";

export type PromptVariableValue = string | number | boolean | null;
export type PromptVariables = Record<string, PromptVariableValue>;

type VariableValidationIssue = {
  path: string;
  message: string;
};

function validationIssuePath(error: {
  instancePath: string;
  keyword: string;
  params: Record<string, unknown>;
}): string {
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

export class VariableValidationError extends Error {
  constructor(public readonly issues: VariableValidationIssue[]) {
    super("prompt variables failed validation");
    this.name = "VariableValidationError";
  }
}

export class MissingTemplateVariableError extends Error {
  constructor(variableName: string) {
    super(`missing template variable: ${variableName}`);
    this.name = "MissingTemplateVariableError";
  }
}

const MAX_COMPILED_VALIDATORS = 1_000;
const ajv = new Ajv({ allErrors: true, strict: false });
const compiledValidators = new Map<string, ReturnType<Ajv["compile"]>>();

function getCompiledValidator(schema: Record<string, unknown>) {
  const cacheKey = JSON.stringify(schema);
  const cachedValidator = compiledValidators.get(cacheKey);

  if (cachedValidator) {
    return cachedValidator;
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

export function validatePromptVariables(
  schema: Record<string, unknown> | null,
  variables: PromptVariables,
): void {
  if (!schema) {
    return;
  }

  const validator = getCompiledValidator(schema);

  if (validator(variables)) {
    return;
  }

  const issues = (validator.errors ?? []).map((error) => ({
    path: validationIssuePath(error),
    message: error.message ?? "validation failed",
  }));

  throw new VariableValidationError(issues);
}

export function renderPromptTemplate(template: string, variables: PromptVariables): string {
  return template.replace(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
    (_match, variableName: string) => {
      if (!Object.hasOwn(variables, variableName)) {
        throw new MissingTemplateVariableError(variableName);
      }

      const value = variables[variableName];
      return value === null ? "" : String(value);
    },
  );
}
