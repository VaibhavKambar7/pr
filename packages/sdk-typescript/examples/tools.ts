import { PrClient, PrError } from "@pr/sdk-typescript";

const client = new PrClient({
  apiKey: requiredEnv("PR_API_KEY"),
  projectId: requiredEnv("PR_PROJECT_ID"),
  baseUrl: process.env.PR_BASE_URL,
});

try {
  const { tools } = await client.listTools();

  if (tools.length === 0) {
    console.log("No enabled tools are registered for this project.");
    process.exit(0);
  }

  console.log(`Available tools: ${tools.map((tool) => tool.slug).join(", ")}`);

  const toolSlug = process.env.PR_TOOL_SLUG ?? tools[0]!.slug;
  const { tool } = await client.fetchTool(toolSlug);
  const input = parseToolInput(process.env.PR_TOOL_INPUT ?? "{}");

  console.log(`${tool.name}: ${tool.description}`);
  await client.validateToolInput(tool.slug, input);
  console.log(`Input is valid for ${tool.slug}.`);
} catch (error) {
  if (error instanceof PrError) {
    console.error(`[${error.code ?? error.status}] ${error.message}`);

    for (const issue of error.issues ?? []) {
      console.error(`  ${issue.path}: ${issue.message}`);
    }

    process.exitCode = 1;
  } else {
    throw error;
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function parseToolInput(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("PR_TOOL_INPUT must be a JSON object");
  }

  return parsed as Record<string, unknown>;
}
