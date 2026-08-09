import type { FastifyReply, FastifyRequest } from "fastify";
import { sendExecutionError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import { listExecutionsQuerySchema, type ListExecutionsQuery } from "./execution.schema.js";
import { getExecutionForProject, listExecutionsForProject } from "./execution.service.js";

type ProjectParams = {
  projectId: string;
};

type ExecutionParams = ProjectParams & {
  executionId: string;
};

export async function listExecutionsController(
  request: FastifyRequest<{ Params: ProjectParams; Querystring: ListExecutionsQuery }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedQuery = listExecutionsQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    return reply.code(400).send({
      error: "invalid query params",
      issues: parsedQuery.error.flatten().fieldErrors,
    });
  }

  try {
    const executions = await listExecutionsForProject(user.id, request.params.projectId, parsedQuery.data);
    return reply.code(200).send({ executions });
  } catch (error) {
    return sendExecutionError(reply, error);
  }
}

export async function getExecutionController(
  request: FastifyRequest<{ Params: ExecutionParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const execution = await getExecutionForProject(
      user.id,
      request.params.projectId,
      request.params.executionId,
    );

    return reply.code(200).send({ execution });
  } catch (error) {
    return sendExecutionError(reply, error);
  }
}
