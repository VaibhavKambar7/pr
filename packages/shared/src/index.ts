export const projectName = "pr";

// ── Template Utilities ──────────────────────────────────────────────────────────

const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export type TemplateAnalysis = {
  variables: string[];
  malformedExpressions: Array<{
    expression: string;
    index: number;
  }>;
};

export function extractTemplateVariables(template: string): string[] {
  const seen = new Set<string>();
  const variables: string[] = [];

  for (const match of template.matchAll(TEMPLATE_VARIABLE_PATTERN)) {
    const name = match[1];

    if (!seen.has(name)) {
      seen.add(name);
      variables.push(name);
    }
  }

  return variables;
}

export function analyzeTemplate(template: string): TemplateAnalysis {
  const variables: string[] = [];
  const seen = new Set<string>();
  const malformedExpressions: TemplateAnalysis["malformedExpressions"] = [];

  const fullPattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}|\{\{[^}]*\}\}/g;

  for (const match of template.matchAll(fullPattern)) {
    const validVar = match[1];

    if (validVar) {
      if (!seen.has(validVar)) {
        seen.add(validVar);
        variables.push(validVar);
      }
    } else {
      malformedExpressions.push({
        expression: match[0],
        index: match.index,
      });
    }
  }

  return { variables, malformedExpressions };
}

// ── Variable Schema Types ──────────────────────────────────────────────────────

export type VariableValidationIssue = {
  path: string;
  keyword: string;
  message: string;
};

export type VariableSchemaValidationResult =
  | { schema: Record<string, unknown>; issues: VariableValidationIssue[] }
  | { schema: null; issues: VariableValidationIssue[] };

export class InvalidVariableSchemaError extends Error {
  constructor(public readonly issues: VariableValidationIssue[]) {
    super("variable schema is not valid");
  }
}

export class VariableValidationError extends Error {
  constructor(public readonly issues: VariableValidationIssue[]) {
    super("prompt variables failed validation");
  }
}

export class SchemaTemplateMismatchError extends Error {
  constructor(public readonly issues: VariableValidationIssue[]) {
    super("the variable schema does not match the template");
  }
}

// ── Variable Schema Validation ─────────────────────────────────────────────────

const SUPPORTED_SCALAR_TYPES = ["string", "number", "integer", "boolean", "null"];
const SUPPORTED_JSON_SCHEMA_KEYS = [
  "type",
  "properties",
  "required",
  "additionalProperties",
  "enum",
  "const",
  "default",
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "pattern",
  "description",
  "title",
];

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function countProperties(obj: Record<string, unknown>): number {
  return Object.keys(obj).length;
}

function measureDepth(obj: unknown, depth = 0): number {
  if (!isJsonObject(obj)) {
    return depth;
  }

  let maxDepth = depth;

  for (const value of Object.values(obj)) {
    const childDepth = measureDepth(value, depth + 1);

    if (childDepth > maxDepth) {
      maxDepth = childDepth;
    }
  }

  return maxDepth;
}

function validatePropertySchema(
  name: string,
  propSchema: Record<string, unknown>,
): VariableValidationIssue[] {
  const issues: VariableValidationIssue[] = [];

  for (const key of Object.keys(propSchema)) {
    if (!SUPPORTED_JSON_SCHEMA_KEYS.includes(key)) {
      issues.push({
        path: `variableSchema.properties.${name}`,
        keyword: "unsupported",
        message: `unsupported JSON Schema key "${key}"`,
      });
    }
  }

  if (propSchema.type !== undefined) {
    const types = Array.isArray(propSchema.type) ? propSchema.type : [propSchema.type];

    for (const t of types) {
      if (!SUPPORTED_SCALAR_TYPES.includes(t as string)) {
        issues.push({
          path: `variableSchema.properties.${name}.type`,
          keyword: "type",
          message: `type "${t}" is not supported. Allowed: ${SUPPORTED_SCALAR_TYPES.join(", ")}`,
        });
      }
    }
  }

  return issues;
}

export function validatePromptVariableSchema(
  schema: unknown,
  templateVariables?: string[],
): VariableSchemaValidationResult {
  const issues: VariableValidationIssue[] = [];

  if (!isJsonObject(schema)) {
    issues.push({
      path: "variableSchema",
      keyword: "type",
      message: "variable schema must be a JSON object",
    });
    return { schema: null, issues };
  }

  const serialized = JSON.stringify(schema);

  if (serialized.length > 32_768) {
    issues.push({
      path: "variableSchema",
      keyword: "size",
      message: "variable schema must be 32768 characters or fewer",
    });
    return { schema: null, issues };
  }

  if (measureDepth(schema) > 5) {
    issues.push({
      path: "variableSchema",
      keyword: "depth",
      message: "variable schema nesting depth must be 5 or fewer",
    });
    return { schema: null, issues };
  }

  if (schema.type !== "object") {
    issues.push({
      path: "variableSchema.type",
      keyword: "type",
      message: 'variable schema root type must be "object"',
    });
  }

  if (schema.$ref !== undefined) {
    issues.push({
      path: "variableSchema.$ref",
      keyword: "ref",
      message: "remote $ref is not supported",
    });
  }

  if (isJsonObject(schema.properties)) {
    const propertyCount = countProperties(schema.properties);

    if (propertyCount > 100) {
      issues.push({
        path: "variableSchema.properties",
        keyword: "maxProperties",
        message: "variable schema must have 100 properties or fewer",
      });
    }

    for (const [name, propSchema] of Object.entries(schema.properties)) {
      if (!isJsonObject(propSchema)) {
        issues.push({
          path: `variableSchema.properties.${name}`,
          keyword: "type",
          message: "property schema must be a JSON object",
        });
        continue;
      }

      issues.push(...validatePropertySchema(name, propSchema));
    }
  }

  if (templateVariables !== undefined) {
    const properties = isJsonObject(schema.properties) ? schema.properties : {};
    const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];

    for (const varName of templateVariables) {
      if (!(varName in properties)) {
        issues.push({
          path: `variableSchema.properties.${varName}`,
          keyword: "required",
          message: `template variable "${varName}" is not declared in the schema`,
        });
      }

      if (!required.includes(varName)) {
        issues.push({
          path: `variableSchema.required`,
          keyword: "required",
          message: `template variable "${varName}" should be listed in "required"`,
        });
      }
    }
  }

  return { schema: issues.length === 0 ? (schema as Record<string, unknown>) : null, issues };
}

export function generateVariableSchemaFromTemplate(template: string): Record<string, unknown> {
  const variables = extractTemplateVariables(template);

  const properties: Record<string, unknown> = {};

  for (const name of variables) {
    properties[name] = {
      type: "string",
      minLength: 1,
    };
  }

  return {
    type: "object",
    properties,
    required: variables,
    additionalProperties: false,
  };
}
