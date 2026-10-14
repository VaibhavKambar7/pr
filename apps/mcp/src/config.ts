const DEFAULT_MCP_HOST = "127.0.0.1";
const DEFAULT_MCP_PORT = 8001;

export type McpConfig = {
  host: string;
  port: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  const host = env.PR_MCP_HOST?.trim() || DEFAULT_MCP_HOST;
  const rawPort = env.PR_MCP_PORT?.trim();
  const port = rawPort ? Number(rawPort) : DEFAULT_MCP_PORT;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PR_MCP_PORT must be an integer between 1 and 65535");
  }

  return { host, port };
}
