import type { FastifyRequest } from "fastify";

export type RuntimeOperation = "get_live_prompt" | "render_live_prompt";

type RuntimePromptParams = {
  projectId: string;
  promptId: string;
};

type RuntimeLogContext = {
  request: FastifyRequest<{ Params: RuntimePromptParams }>;
  operation: RuntimeOperation;
  startedAt: number;
  statusCode: number;
};

export function logRuntimeSuccess(context: RuntimeLogContext) {
  const { request, operation, startedAt, statusCode } = context;

  request.log.info(
    {
      event: "runtime.request.succeeded",
      operation,
      projectId: request.params.projectId,
      promptId: request.params.promptId,
      statusCode,
      latencyMs: Date.now() - startedAt,
    },
    "Runtime request succeeded",
  );
}

export function logRuntimeFailure(
  context: RuntimeLogContext & {
    errorCode: string;
    errorName?: string;
  },
) {
  const { request, operation, startedAt, statusCode, errorCode, errorName } = context;

  request.log.warn(
    {
      event: "runtime.request.failed",
      operation,
      projectId: request.params.projectId,
      promptId: request.params.promptId,
      authType: request.apiKey ? "api_key" : "user",
      statusCode,
      errorCode,
      ...(request.apiKey && errorCode === "RUNTIME_PROJECT_ACCESS_DENIED"
        ? { failureReason: "project_mismatch" }
        : {}),
      ...(errorName ? { errorName } : {}),
      latencyMs: Date.now() - startedAt,
    },
    "Runtime request failed",
  );
}
