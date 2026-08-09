import type { FastifyReply, FastifyRequest } from "fastify";
import { sendApiKeyError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import { createApiKeyForProject, listApiKeysForProject, revokeApiKeyForProject } from "./api-key.service.js";
import { createApiKeySchema } from "./api-key.schema.js";

type ProjectParams = {
  projectId: string;
};

type ApiKeyParams = ProjectParams & {
  apiKeyId: string;
};

export async function createApiKeyController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = createApiKeySchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      error: "invalid request body",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await createApiKeyForProject(user.id, request.params.projectId, parsedBody.data);
    return reply.code(201).send(result);
  } catch (error) {
    return sendApiKeyError(reply, error);
  }
}

export async function listApiKeysController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const apiKeys = await listApiKeysForProject(user.id, request.params.projectId);
    return reply.code(200).send({ apiKeys });
  } catch (error) {
    return sendApiKeyError(reply, error);
  }
}

export async function revokeApiKeyController(
  request: FastifyRequest<{ Params: ApiKeyParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    await revokeApiKeyForProject(user.id, request.params.projectId, request.params.apiKeyId);
    return reply.code(204).send();
  } catch (error) {
    return sendApiKeyError(reply, error);
  }
}
