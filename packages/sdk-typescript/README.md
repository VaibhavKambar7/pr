# TypeScript SDK

Use the Pr runtime API from a TypeScript application. This package is currently private to this monorepo and is not published to npm.

Install workspace dependencies from the repository root with `npm install`, then configure a project API key, project ID, and API URL:

```ts
import { PrClient, PrError } from "@pr/sdk-typescript";

const client = new PrClient({
  apiKey: process.env.PR_API_KEY!,
  projectId: process.env.PR_PROJECT_ID!,
  baseUrl: process.env.PR_BASE_URL ?? "http://localhost:3001",
  timeoutMs: 10_000,
});

const promptId = process.env.PR_PROMPT_ID!;

try {
  const { promptVersion } = await client.fetchPrompt(promptId);
  console.log(`Live version: ${promptVersion.version}`);

  const { tools } = await client.listTools();
  console.log(`Available tools: ${tools.map((tool) => tool.slug).join(", ")}`);

  if (tools[0]) {
    const { tool } = await client.fetchTool(tools[0].slug);
    console.log(`${tool.name}: ${tool.description}`);

    await client.validateToolInput(tool.slug, { customer_id: "cus_123" });
  }

  const result = await client.renderPrompt(promptId, {
    variables: { customer_name: "Asha", issue: "a delayed order" },
  });

  console.log(result.renderedPrompt);
} catch (error) {
  if (error instanceof PrError) {
    console.error(error.code ?? error.status, error.message, error.issues);
  } else {
    throw error;
  }
}
```

`fetchPrompt()` fetches the live prompt version; `renderPrompt()` validates variables and renders it on the server. Both methods also accept an optional `tag` to select a tagged version. `listTools()` returns the project's registered tool definitions, `fetchTool()` retrieves one by slug, and `validateToolInput()` checks arguments against its JSON Schema. Rendering creates an execution-history record.

The existing `client.runtime.get()` and `client.runtime.render()` methods remain available. Set `PR_API_KEY` to a project-level API key and `PR_PROMPT_ID` to the prompt's ID (not its slug). Keep the API key on the server; never expose it in browser code.

From the repository root, run `npm run build:sdk` and `npm run typecheck:sdk`. See [the runnable example](./examples/basic.ts) for a complete script.
