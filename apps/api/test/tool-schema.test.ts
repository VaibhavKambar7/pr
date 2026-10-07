import { describe, expect, it } from "vitest";
import { createToolSchema } from "../src/modules/tools/tool.schema.js";

function toolWithSchema(inputSchema: Record<string, unknown>) {
  return {
    name: "Weather lookup",
    description: "Looks up weather for a city",
    inputSchema,
  };
}

describe("tool input schema registration", () => {
  it("accepts a bounded object schema with local references", () => {
    const result = createToolSchema.safeParse(
      toolWithSchema({
        type: "object",
        properties: { location: { $ref: "#/$defs/location" } },
        $defs: {
          location: {
            type: "object",
            properties: { city: { type: "string" } },
            required: ["city"],
          },
        },
      }),
    );

    expect(result.success).toBe(true);
  });

  it("rejects oversized schemas", () => {
    const result = createToolSchema.safeParse(
      toolWithSchema({ type: "object", description: "x".repeat(33_000) }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("32768 bytes");
  });

  it("rejects deeply nested schemas", () => {
    let nested: Record<string, unknown> = { type: "string" };
    for (let index = 0; index < 12; index += 1) {
      nested = { type: "object", properties: { child: nested } };
    }

    const result = createToolSchema.safeParse(toolWithSchema(nested));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("10 levels");
  });

  it("rejects remote schema references", () => {
    const result = createToolSchema.safeParse(
      toolWithSchema({
        type: "object",
        properties: { city: { $ref: "https://example.com/location.schema.json" } },
      }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("remote JSON Schema references");
  });
});
