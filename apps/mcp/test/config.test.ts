import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("uses safe local defaults", () => {
    expect(loadConfig({})).toEqual({
      host: "127.0.0.1",
      port: 8001,
    });
  });

  it("accepts and trims custom values", () => {
    expect(
      loadConfig({
        PR_MCP_HOST: " 0.0.0.0 ",
        PR_MCP_PORT: " 9001 ",
      }),
    ).toEqual({
      host: "0.0.0.0",
      port: 9001,
    });
  });

  it("uses defaults for empty values", () => {
    expect(loadConfig({ PR_MCP_HOST: " ", PR_MCP_PORT: " " })).toEqual({
      host: "127.0.0.1",
      port: 8001,
    });
  });

  it.each(["abc", "12.5", "0", "65536", "-1"])("rejects invalid port %s", (port) => {
    expect(() => loadConfig({ PR_MCP_PORT: port })).toThrow(
      "PR_MCP_PORT must be an integer between 1 and 65535",
    );
  });
});
