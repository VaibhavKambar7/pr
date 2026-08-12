export function parseJsonObject(value: string, label: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }

  return parsed as Record<string, unknown>;
}

export type TemplateVariables = Record<string, string | number | boolean | null>;

export function parseTemplateVariables(value: string) {
  const parsed = parseJsonObject(value, "variables") ?? {};

  for (const [key, variableValue] of Object.entries(parsed)) {
    const isValidValue =
      variableValue === null ||
      typeof variableValue === "string" ||
      typeof variableValue === "number" ||
      typeof variableValue === "boolean";

    if (!isValidValue) {
      throw new Error(`variable "${key}" must be a string, number, boolean, or null`);
    }
  }

  return parsed as TemplateVariables;
}
