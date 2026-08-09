import type { FastifyReply, FastifyRequest } from "fastify";
import { sendPromptError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import {
  createPromptForProject,
  deletePromptForProject,
  getPromptForProject,
  listPromptsForProject,
  updatePromptForProject,
} from "./prompt.service.js";
import { createPromptSchema, updatePromptSchema } from "./prompt.schema.js";

type ProjectParams = {
  projectId: string;
};

type PromptParams = ProjectParams & {
  promptId: string;
};

export async function createPromptController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = createPromptSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const prompt = await createPromptForProject(user.id, request.params.projectId, parsedBody.data);
    return reply.code(201).send({ prompt });
  } catch (error) {
    return sendPromptError(reply, error);
  }
}

export async function listPromptsController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const prompts = await listPromptsForProject(user.id, request.params.projectId);
    return reply.code(200).send({ prompts });
  } catch (error) {
    return sendPromptError(reply, error);
  }
}

export async function getPromptController(
  request: FastifyRequest<{ Params: PromptParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const prompt = await getPromptForProject(user.id, request.params.projectId, request.params.promptId);
    return reply.code(200).send({ prompt });
  } catch (error) {
    return sendPromptError(reply, error);
  }
}

export async function updatePromptController(
  request: FastifyRequest<{ Params: PromptParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = updatePromptSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const prompt = await updatePromptForProject(
      user.id,
      request.params.projectId,
      request.params.promptId,
      parsedBody.data,
    );

    return reply.code(200).send({ prompt });
  } catch (error) {
    return sendPromptError(reply, error);
  }
}

export async function deletePromptController(
  request: FastifyRequest<{ Params: PromptParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    await deletePromptForProject(user.id, request.params.projectId, request.params.promptId);
    return reply.code(204).send();
  } catch (error) {
    return sendPromptError(reply, error);
  }
}
