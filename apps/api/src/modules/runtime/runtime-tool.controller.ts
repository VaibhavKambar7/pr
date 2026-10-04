import type { FastifyReply, FastifyRequest } from "fastify";
import { getRuntimeErrorDetails, sendRuntimeError } from "../../shared/errors.js";
import { getRuntimeContext } from "./runtime.context.js";
import { logRuntimeFailure, logRuntimeSuccess } from "./runtime.logging.js";
import {
  getRuntimeTool,
  listRuntimeTools,
  validateRuntimeToolInput,
} from "./runtime-tool.service.js";
import { validateToolInputSchema } from "./runtime.schema.js";

type RuntimeToolParams = {
  projectId: string;
};

type RuntimeToolSlugParams = RuntimeToolParams & {
  toolSlug: string;
};

export async function listRuntimeToolsController(
  request: FastifyRequest<{ Params: RuntimeToolParams }>,
  reply: FastifyReply,
) {
  const startedAt = Date.now();
  const context = getRuntimeContext(request, reply);

  if (!context) {
    return;
  }

  try {
    const tools = await listRuntimeTools(context, request.params.projectId);
    logRuntimeSuccess({
      request,
      operation: "list_tools",
      projectId: request.params.projectId,
      startedAt,
      statusCode: 200,
    });
    return reply.code(200).send({ tools });
  } catch (error) {
    const errorDetails = getRuntimeErrorDetails(error);
    logRuntimeFailure({
      request,
      operation: "list_tools",
      projectId: request.params.projectId,
      startedAt,
      ...errorDetails,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return sendRuntimeError(reply, error);
  }
}

export async function getRuntimeToolController(
  request: FastifyRequest<{ Params: RuntimeToolSlugParams }>,
  reply: FastifyReply,
) {
  const startedAt = Date.now();
  const context = getRuntimeContext(request, reply);

  if (!context) {
    return;
  }

  try {
    const tool = await getRuntimeTool(
      context,
      request.params.projectId,
      request.params.toolSlug,
    );
    logRuntimeSuccess({
      request,
      operation: "get_tool",
      projectId: request.params.projectId,
      toolSlug: request.params.toolSlug,
      startedAt,
      statusCode: 200,
    });
    return reply.code(200).send({ tool });
  } catch (error) {
    const errorDetails = getRuntimeErrorDetails(error);
    logRuntimeFailure({
      request,
      operation: "get_tool",
      projectId: request.params.projectId,
      toolSlug: request.params.toolSlug,
      startedAt,
      ...errorDetails,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return sendRuntimeError(reply, error);
  }
}

export async function validateRuntimeToolInputController(
  request: FastifyRequest<{ Params: RuntimeToolSlugParams }>,
  reply: FastifyReply,
) {
  const startedAt = Date.now();
  const context = getRuntimeContext(request, reply);

  if (!context) {
    return;
  }

  const parsedBody = validateToolInputSchema.safeParse(request.body);

  if (!parsedBody.success) {
    logRuntimeFailure({
      request,
      operation: "validate_tool_input",
      projectId: request.params.projectId,
      toolSlug: request.params.toolSlug,
      startedAt,
      statusCode: 400,
      errorCode: "INVALID_REQUEST_BODY",
    });
    return reply.code(400).send({
      error: {
        code: "INVALID_REQUEST_BODY",
        message: "invalid request body",
        issues: parsedBody.error.issues.map((issue) => ({
          path: issue.path.length > 0 ? issue.path.join(".") : "/",
          message: issue.message,
        })),
      },
    });
  }

  try {
    const result = await validateRuntimeToolInput(
      context,
      request.params.projectId,
      request.params.toolSlug,
      parsedBody.data.input,
    );
    logRuntimeSuccess({
      request,
      operation: "validate_tool_input",
      projectId: request.params.projectId,
      toolSlug: request.params.toolSlug,
      startedAt,
      statusCode: 200,
    });
    return reply.code(200).send(result);
  } catch (error) {
    const errorDetails = getRuntimeErrorDetails(error);
    logRuntimeFailure({
      request,
      operation: "validate_tool_input",
      projectId: request.params.projectId,
      toolSlug: request.params.toolSlug,
      startedAt,
      ...errorDetails,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return sendRuntimeError(reply, error);
  }
}
