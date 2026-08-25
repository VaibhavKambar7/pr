import { PrClient, PrError } from "@pr/sdk";

const client = new PrClient({
  apiKey: requiredEnv("PR_API_KEY"),
  projectId: requiredEnv("PR_PROJECT_ID"),
  baseUrl: process.env.PR_BASE_URL,
});

const promptId = requiredEnv("PR_PROMPT_ID");

try {
  const livePrompt = await client.runtime.get(promptId);

  console.log(`Using ${livePrompt.prompt.slug} v${livePrompt.promptVersion.version}`);

  const result = await client.runtime.render(promptId, {
    variables: {
      customer_name: "Asha",
      issue: "a delayed order",
    },
  });

  console.log(result.renderedPrompt);
  console.log(`Execution recorded: ${result.executionId}`);
} catch (error) {
  if (error instanceof PrError) {
    console.error(`[${error.code ?? error.status}] ${error.message}`);
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
