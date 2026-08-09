import type { FastifyReply, FastifyRequest } from "fastify";
import type { Prisma } from "@pr/database";
import { sendPromptVersionError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import {
  createVersionForPrompt,
  getVersionForPrompt,
  listVersionsForPrompt,
  promoteVersionForPrompt,
  rollbackVersionForPrompt,
} from "./prompt-version.service.js";
import { createPromptVersionSchema } from "./prompt-version.schema.js";

type PromptParams = {
  projectId: string;
  promptId: string;
};

type PromptVersionParams = PromptParams & {
  version: string;
};

function toCreatePromptVersionInput(input: {
  template: string;
  model?: string;
  modelParams?: Record<string, unknown>;
}) {
  return {
    template: input.template,
    model: input.model,
    modelParams: input.modelParams as Prisma.InputJsonValue | undefined,
  };
}

export async function createPromptVersionController(
  request: FastifyRequest<{ Params: PromptParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = createPromptVersionSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const promptVersion = await createVersionForPrompt(
      user.id,
      request.params.projectId,
      request.params.promptId,
      toCreatePromptVersionInput(parsedBody.data),
    );

    return reply.code(201).send({ promptVersion });
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}

export async function listPromptVersionsController(
  request: FastifyRequest<{ Params: PromptParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const promptVersions = await listVersionsForPrompt(user.id, request.params.projectId, request.params.promptId);
    return reply.code(200).send({ promptVersions });
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}

export async function getPromptVersionController(
  request: FastifyRequest<{ Params: PromptVersionParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const promptVersion = await getVersionForPrompt(
      user.id,
      request.params.projectId,
      request.params.promptId,
      request.params.version,
    );

    return reply.code(200).send({ promptVersion });
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}

export async function promotePromptVersionController(
  request: FastifyRequest<{ Params: PromptVersionParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const promptVersion = await promoteVersionForPrompt(
      user.id,
      request.params.projectId,
      request.params.promptId,
      request.params.version,
    );

    return reply.code(200).send({ promptVersion });
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}

export async function rollbackPromptVersionController(
  request: FastifyRequest<{ Params: PromptVersionParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const promptVersion = await rollbackVersionForPrompt(
      user.id,
      request.params.projectId,
      request.params.promptId,
      request.params.version,
    );

    return reply.code(200).send({ promptVersion });
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}
