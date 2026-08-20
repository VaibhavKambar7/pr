import type { FastifyReply, FastifyRequest } from "fastify";
import type { Prisma } from "@pr/database";
import { sendPromptVersionError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import {
  createVersionForPrompt,
  getVersionForPrompt,
  listTagsForPrompt,
  listVersionsForPrompt,
  promoteVersionForPrompt,
  removeTagForPrompt,
  rollbackVersionForPrompt,
  setTagForPromptVersion,
} from "./prompt-version.service.js";
import { createPromptVersionSchema, setLivePromptVersionSchema, setVersionTagSchema, type SetVersionTagInput } from "./prompt-version.schema.js";

type PromptParams = {
  projectId: string;
  promptId: string;
};

type PromptVersionParams = PromptParams & {
  version: string;
};

function toCreatePromptVersionInput(input: {
  template: string;
  variableSchema?: Record<string, unknown>;
  model?: string;
  modelParams?: Record<string, unknown>;
}) {
  return {
    template: input.template,
    variableSchema: input.variableSchema,
    model: input.model,
    modelParams: input.modelParams as Prisma.InputJsonValue | undefined,
  };
}

function readIdempotencyKey(request: FastifyRequest): string | undefined {
  const raw = request.headers["idempotency-key"];

  if (raw === undefined || raw === null) {
    return undefined;
  }

  const key = Array.isArray(raw) ? raw[0] : raw;

  if (key.length > 128) {
    return undefined;
  }

  const trimmed = key.trim();

  return trimmed.length > 0 ? trimmed : undefined;
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

  const idempotencyKey = readIdempotencyKey(request);

  if (idempotencyKey !== undefined && request.headers["idempotency-key"]!.length > 128) {
    return reply.code(400).send({ error: "idempotency key must be 128 characters or fewer" });
  }

  try {
    const result = await createVersionForPrompt(
      user.id,
      request.params.projectId,
      request.params.promptId,
      toCreatePromptVersionInput(parsedBody.data),
      idempotencyKey,
    );

    return reply
      .header("Idempotency-Replayed", String(result.replayed))
      .code(result.replayed ? 200 : 201)
      .send({ promptVersion: result.promptVersion });
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
  request: FastifyRequest<{ Params: PromptVersionParams; Body: { expectedLiveVersion: number | null } }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = setLivePromptVersionSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const promptVersion = await promoteVersionForPrompt(
      user.id,
      request.params.projectId,
      request.params.promptId,
      request.params.version,
      parsedBody.data.expectedLiveVersion,
    );

    return reply.code(200).send({ promptVersion });
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}

export async function rollbackPromptVersionController(
  request: FastifyRequest<{ Params: PromptVersionParams; Body: { expectedLiveVersion: number | null } }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = setLivePromptVersionSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const promptVersion = await rollbackVersionForPrompt(
      user.id,
      request.params.projectId,
      request.params.promptId,
      request.params.version,
      parsedBody.data.expectedLiveVersion,
    );

    return reply.code(200).send({ promptVersion });
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}

type TagParams = PromptVersionParams;

export async function setVersionTagController(
  request: FastifyRequest<{ Params: TagParams; Body: SetVersionTagInput }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = setVersionTagSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const tag = await setTagForPromptVersion(
      user.id,
      request.params.projectId,
      request.params.promptId,
      request.params.version,
      parsedBody.data,
    );

    return reply.code(200).send({ tag });
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}

type RemoveTagParams = PromptParams & {
  tag: string;
};

export async function removeVersionTagController(
  request: FastifyRequest<{ Params: RemoveTagParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    await removeTagForPrompt(
      user.id,
      request.params.projectId,
      request.params.promptId,
      request.params.tag,
    );

    return reply.code(204).send();
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}

export async function listPromptTagsController(
  request: FastifyRequest<{ Params: PromptParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const tags = await listTagsForPrompt(
      user.id,
      request.params.projectId,
      request.params.promptId,
    );

    return reply.code(200).send({ tags });
  } catch (error) {
    return sendPromptVersionError(reply, error);
  }
}
