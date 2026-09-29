import type { FastifyReply, FastifyRequest } from "fastify";
import { getRuntimeErrorDetails, sendRuntimeError } from "../../shared/errors.js";
import { getRuntimeContext } from "./runtime.context.js";
import { logRuntimeFailure, logRuntimeSuccess } from "./runtime.logging.js";
import { getRuntimeTool, listRuntimeTools } from "./runtime-tool.service.js";

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
