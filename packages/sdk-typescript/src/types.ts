export type PromptVariableValue = string | number | boolean | null;

export type PromptVariables = Record<string, PromptVariableValue>;

export type PromptVersionStatus = "DRAFT" | "LIVE" | "ARCHIVED";

export type Prompt = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromptVersion = {
  id: string;
  promptId: string;
  version: number;
  status: PromptVersionStatus;
  template: string;
  variableSchema: Record<string, unknown> | null;
  model: string | null;
  modelParams: unknown;
  createdAt: string;
  promotedAt: string | null;
};

export type RuntimeGetResult = {
  prompt: Prompt;
  promptVersion: PromptVersion;
};

export type RuntimeRenderResult = {
  executionId: string;
  prompt: Prompt;
  promptVersion: PromptVersion;
  renderedPrompt: string;
};

export type GetPromptOptions = {
  tag?: string;
  signal?: AbortSignal;
};

export type RenderPromptInput = {
  variables: PromptVariables;
  tag?: string;
  signal?: AbortSignal;
};
