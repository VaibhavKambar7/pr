import type { FastifyReply, FastifyRequest } from "fastify";
import "../auth/auth.types.js";
import {
  ProjectConflictError,
  ProjectNotFoundError,
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

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    void reply.code(401).send({ error: "unauthorized" });
    return null;
  }

  return request.user;
}

function sendProjectError(reply: FastifyReply, error: unknown) {
  if (error instanceof ProjectNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  if (error instanceof ProjectConflictError) {
    return reply.code(409).send({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "project operation failed";
  return reply.code(500).send({ error: message });
}

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
