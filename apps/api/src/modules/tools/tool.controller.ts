import type { FastifyReply, FastifyRequest } from "fastify";
import { sendToolError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import {
  createToolSchema,
  updateToolSchema,
  validateRegisteredToolInputSchema,
} from "./tool.schema.js";
import {
  createToolForProject,
  deleteToolForProject,
  getToolForProject,
  listToolsForProject,
  updateToolForProject,
  validateToolInputForProject,
} from "./tool.service.js";

type ProjectParams = {
  projectId: string;
};

type ToolParams = ProjectParams & {
  toolId: string;
};

export async function createToolController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = createToolSchema.safeParse(request.body);

  if (!parsedBody.success) {
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
    const tool = await createToolForProject(user.id, request.params.projectId, parsedBody.data);
    return reply.code(201).send({ tool });
  } catch (error) {
    return sendToolError(reply, error);
  }
}

export async function listToolsController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const tools = await listToolsForProject(user.id, request.params.projectId);
    return reply.code(200).send({ tools });
  } catch (error) {
    return sendToolError(reply, error);
  }
}

export async function getToolController(
  request: FastifyRequest<{ Params: ToolParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const tool = await getToolForProject(
      user.id,
      request.params.projectId,
      request.params.toolId,
    );
    return reply.code(200).send({ tool });
  } catch (error) {
    return sendToolError(reply, error);
  }
}

export async function updateToolController(
  request: FastifyRequest<{ Params: ToolParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = updateToolSchema.safeParse(request.body);

  if (!parsedBody.success) {
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
    const tool = await updateToolForProject(
      user.id,
      request.params.projectId,
      request.params.toolId,
      parsedBody.data,
    );
    return reply.code(200).send({ tool });
  } catch (error) {
    return sendToolError(reply, error);
  }
}

export async function deleteToolController(
  request: FastifyRequest<{ Params: ToolParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    await deleteToolForProject(user.id, request.params.projectId, request.params.toolId);
    return reply.code(204).send();
  } catch (error) {
    return sendToolError(reply, error);
  }
}

export async function validateToolInputController(
  request: FastifyRequest<{ Params: ToolParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = validateRegisteredToolInputSchema.safeParse(request.body);

  if (!parsedBody.success) {
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
    const result = await validateToolInputForProject(
      user.id,
      request.params.projectId,
      request.params.toolId,
      parsedBody.data.input,
    );
    return reply.code(200).send(result);
  } catch (error) {
    return sendToolError(reply, error);
  }
}
