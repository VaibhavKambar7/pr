import { describe, expect, it, vi } from "vitest";
import { PrClient, PrValidationError } from "../src/index.js";

const tool = {
  id: "tool_1",
  projectId: "project/one",
  name: "Get weather",
  slug: "weather/current",
  description: "Get the current weather",
  inputSchema: { type: "object", properties: { city: { type: "string" } } },
  createdAt: "2026-10-05T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
};

describe("PrClient tool methods", () => {
  it("lists project tools with API-key authentication", async () => {
    const fetchMock = mockFetch({ tools: [tool] });
    const client = createClient(fetchMock);

    await expect(client.listTools()).resolves.toEqual({ tools: [tool] });
    expectRequest(fetchMock, "http://localhost:3001/runtime/projects/project%2Fone/tools", "GET");
  });

  it("fetches a tool using an encoded slug", async () => {
    const fetchMock = mockFetch({ tool });
    const client = createClient(fetchMock);

    await expect(client.fetchTool("weather/current")).resolves.toEqual({ tool });
    expectRequest(
      fetchMock,
      "http://localhost:3001/runtime/projects/project%2Fone/tools/weather%2Fcurrent",
      "GET",
    );
  });

  it("posts tool input for server-side validation", async () => {
    const fetchMock = mockFetch({ tool, valid: true });
    const client = createClient(fetchMock);

    await expect(
      client.validateToolInput("weather/current", { city: "Bengaluru" }),
    ).resolves.toEqual({ tool, valid: true });

    expectRequest(
      fetchMock,
      "http://localhost:3001/runtime/projects/project%2Fone/tools/weather%2Fcurrent/validate",
      "POST",
      JSON.stringify({ input: { city: "Bengaluru" } }),
    );
  });

  it("preserves structured tool validation errors", async () => {
    const issues = [{ path: "/city", message: "must have required property 'city'" }];
    const fetchMock = mockFetch(
      {
        error: {
          code: "TOOL_INPUT_VALIDATION_FAILED",
          message: "tool input failed validation",
          issues,
        },
      },
      400,
    );
    const client = createClient(fetchMock);

    try {
      await client.validateToolInput("weather", {});
      throw new Error("expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(PrValidationError);
      expect(error).toMatchObject({
        status: 400,
        code: "TOOL_INPUT_VALIDATION_FAILED",
        issues,
      });
    }
  });
});

function createClient(fetchMock: typeof fetch) {
  return new PrClient({
    apiKey: "pr_secret",
    projectId: "project/one",
    fetch: fetchMock,
  });
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function expectRequest(
  fetchMock: ReturnType<typeof mockFetch>,
  expectedUrl: string,
  expectedMethod: string,
  expectedBody?: string,
) {
  expect(fetchMock).toHaveBeenCalledOnce();
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(String(url)).toBe(expectedUrl);
  expect(init?.method).toBe(expectedMethod);
  expect(init?.headers).toMatchObject({ Authorization: "Bearer pr_secret" });
  expect(init?.body).toBe(expectedBody);
}
