import type { FastifyRequest } from "fastify";

export type RuntimeOperation =
  | "get_live_prompt"
  | "render_live_prompt"
  | "list_tools"
  | "get_tool"
  | "validate_tool_input";

type RuntimeResourceIdentity = {
  projectId: string;
  promptId?: string;
  toolSlug?: string;
};

type RuntimeLogContext = RuntimeResourceIdentity & {
  request: Pick<FastifyRequest, "log" | "apiKey">;
  operation: RuntimeOperation;
  startedAt: number;
  statusCode: number;
};

export function logRuntimeSuccess(context: RuntimeLogContext) {
  const { request, operation, projectId, promptId, toolSlug, startedAt, statusCode } = context;

  request.log.info(
    {
      event: "runtime.request.succeeded",
      operation,
      projectId,
      promptId,
      toolSlug,
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
  const {
    request,
    operation,
    projectId,
    promptId,
    toolSlug,
    startedAt,
    statusCode,
    errorCode,
    errorName,
  } = context;

  request.log.warn(
    {
      event: "runtime.request.failed",
      operation,
      projectId,
      promptId,
      toolSlug,
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
