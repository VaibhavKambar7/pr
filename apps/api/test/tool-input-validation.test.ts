import { describe, expect, it } from "vitest";
import {
  ToolInputValidationError,
  validateToolInput,
} from "../src/shared/tool-input-validation.js";

const schema = {
  type: "object",
  properties: {
    city: { type: "string", minLength: 1 },
    units: { type: "string", enum: ["metric", "imperial"] },
  },
  required: ["city"],
  additionalProperties: false,
};

describe("validateToolInput", () => {
  it("accepts input that matches the registered schema", () => {
    expect(() => validateToolInput(schema, { city: "Bengaluru", units: "metric" })).not.toThrow();
  });

  it("reports missing and unexpected fields together", () => {
    expectValidationIssues({ units: "metric", country: "IN" }, ["/city", "/country"]);
  });

  it("reports nested missing-property paths", () => {
    const nestedSchema = {
      type: "object",
      properties: {
        address: {
          type: "object",
          properties: { postcode: { type: "string" } },
          required: ["postcode"],
        },
      },
      required: ["address"],
    };

    try {
      validateToolInput(nestedSchema, { address: {} });
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ToolInputValidationError);
      expect((error as ToolInputValidationError).issues).toEqual([
        { path: "/address/postcode", message: "must have required property 'postcode'" },
      ]);
    }
  });
});

function expectValidationIssues(input: Record<string, unknown>, expectedPaths: string[]) {
  try {
    validateToolInput(schema, input);
    throw new Error("expected validation to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(ToolInputValidationError);
    expect((error as ToolInputValidationError).issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(expectedPaths),
    );
  }
}
