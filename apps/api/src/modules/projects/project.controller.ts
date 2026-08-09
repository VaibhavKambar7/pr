import type { FastifyReply, FastifyRequest } from "fastify";
import { sendProjectError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import {
  createProjectForUser,
  deleteProjectForUser,
  getProjectForUser,
  listProjectsForUser,
  updateProjectForUser,
} from "./project.service.js";
import { createProjectSchema, updateProjectSchema } from "./project.schema.js";

type ProjectParams = {
  projectId: string;
};

export async function createProjectController(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = createProjectSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const project = await createProjectForUser(user.id, parsedBody.data);
    return reply.code(201).send({ project });
  } catch (error) {
    return sendProjectError(reply, error);
  }
}

export async function listProjectsController(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const projects = await listProjectsForUser(user.id);
  return reply.code(200).send({ projects });
}

export async function getProjectController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const project = await getProjectForUser(user.id, request.params.projectId);
    return reply.code(200).send({ project });
  } catch (error) {
    return sendProjectError(reply, error);
  }
}

export async function updateProjectController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = updateProjectSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const project = await updateProjectForUser(user.id, request.params.projectId, parsedBody.data);
    return reply.code(200).send({ project });
  } catch (error) {
    return sendProjectError(reply, error);
  }
}

export async function deleteProjectController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    await deleteProjectForUser(user.id, request.params.projectId);
    return reply.code(204).send();
  } catch (error) {
    return sendProjectError(reply, error);
  }
}
