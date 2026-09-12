import type { FastifyReply, FastifyRequest } from "fastify";
import { sendRuntimeError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import { getLivePromptVersion, renderLivePrompt } from "./runtime.service.js";
import { renderLivePromptSchema, runtimeQuerySchema } from "./runtime.schema.js";

type RuntimePromptParams = {
  projectId: string;
  promptId: string;
};

function getRuntimeContext(request: FastifyRequest, reply: FastifyReply) {
  if (request.apiKey) {
    return {
      type: "apiKey" as const,
      apiKeyId: request.apiKey.id,
      projectId: request.apiKey.projectId,
    };
  }

  const user = requireUser(request, reply);

  if (!user) {
    return null;
  }

  return {
    type: "user" as const,
    userId: user.id,
  };
}

export async function getLivePromptVersionController(
  request: FastifyRequest<{ Params: RuntimePromptParams; Querystring: { tag?: string } }>,
  reply: FastifyReply,
) {
  const startedAt = Date.now();
  const context = getRuntimeContext(request, reply);

  if (!context) {
    return;
  }

  const parsedQuery = runtimeQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    request.log.warn(
      {
        event: "runtime.request.failure",
        operation: "get_live_prompt",
        requestId: request.id,
        projectId: request.params.projectId,
        promptId: request.params.promptId,
        statusCode: 400,
        latencyMs: Date.now() - startedAt,
        error: "invalid query parameters",
      },
      "Runtime prompt fetch rejected",
    );

    return reply.code(400).send({
      error: "invalid query parameters",
      issues: parsedQuery.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await getLivePromptVersion(
      context,
      request.params.projectId,
      request.params.promptId,
      parsedQuery.data.tag,
    );

    request.log.info(
      {
        event: "runtime.request.success",
        operation: "get_live_prompt",
        requestId: request.id,
        projectId: request.params.projectId,
        promptId: request.params.promptId,
        statusCode: 200,
        latencyMs: Date.now() - startedAt,
      },
      "Runtime prompt fetch succeeded",
    );

    return reply.code(200).send(result);
  } catch (error) {
    request.log.warn(
      {
        event: "runtime.request.failure",
        operation: "get_live_prompt",
        requestId: request.id,
        projectId: request.params.projectId,
        promptId: request.params.promptId,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "unknown runtime error",
      },
      "Runtime prompt fetch failed",
    );

    return sendRuntimeError(reply, error);
  }
}

export async function renderLivePromptController(
  request: FastifyRequest<{ Params: RuntimePromptParams; Querystring: { tag?: string } }>,
  reply: FastifyReply,
) {
  const startedAt = Date.now();
  const context = getRuntimeContext(request, reply);

  if (!context) {
    return;
  }

  const parsedBody = renderLivePromptSchema.safeParse(request.body);

  if (!parsedBody.success) {
    request.log.warn(
      {
        event: "runtime.request.failure",
        operation: "render_live_prompt",
        requestId: request.id,
        projectId: request.params.projectId,
        promptId: request.params.promptId,
        statusCode: 400,
        latencyMs: Date.now() - startedAt,
        error: "invalid request body",
      },
      "Runtime prompt render rejected",
    );

    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  const parsedQuery = runtimeQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    request.log.warn(
      {
        event: "runtime.request.failure",
        operation: "render_live_prompt",
        requestId: request.id,
        projectId: request.params.projectId,
        promptId: request.params.promptId,
        statusCode: 400,
        latencyMs: Date.now() - startedAt,
        error: "invalid query parameters",
      },
      "Runtime prompt render rejected",
    );

    return reply.code(400).send({
      error: "invalid query parameters",
      issues: parsedQuery.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await renderLivePrompt(
      context,
      request.params.projectId,
      request.params.promptId,
      parsedBody.data,
      parsedQuery.data.tag,
    );

    request.log.info(
      {
        event: "runtime.request.success",
        operation: "render_live_prompt",
        requestId: request.id,
        projectId: request.params.projectId,
        promptId: request.params.promptId,
        statusCode: 200,
        latencyMs: Date.now() - startedAt,
      },
      "Runtime prompt render succeeded",
    );

    return reply.code(200).send(result);
  } catch (error) {
    request.log.warn(
      {
        event: "runtime.request.failure",
        operation: "render_live_prompt",
        requestId: request.id,
        projectId: request.params.projectId,
        promptId: request.params.promptId,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "unknown runtime error",
      },
      "Runtime prompt render failed",
    );

    return sendRuntimeError(reply, error);
  }
}
