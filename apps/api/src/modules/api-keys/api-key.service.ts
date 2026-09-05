import { createHash, randomBytes } from "node:crypto";
import { getProjectForUser } from "../projects/project.service.js";
import {
  createApiKey,
  findActiveApiKeyByHash,
  listApiKeysByProject,
  revokeApiKey,
  touchApiKeyLastUsedAt,
} from "./api-key.repository.js";
import type { CreateApiKeyInput } from "./api-key.schema.js";

export class ApiKeyNotFoundError extends Error {
  constructor() {
    super("api key not found");
  }
}

function generateRawApiKey() {
  return `pr_${randomBytes(32).toString("base64url")}`;
}

function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

function getApiKeyPrefix(rawKey: string) {
  return rawKey.slice(0, 10);
}

export async function createApiKeyForProject(ownerId: string, projectId: string, input: CreateApiKeyInput) {
  await getProjectForUser(ownerId, projectId);

  const rawKey = generateRawApiKey();
  const apiKey = await createApiKey({
    projectId,
    ownerId,
    createdById: ownerId,
    name: input.name,
    keyHash: hashApiKey(rawKey),
    prefix: getApiKeyPrefix(rawKey),
  });

  return {
    apiKey,
    key: rawKey,
  };
}

export async function listApiKeysForProject(ownerId: string, projectId: string) {
  await getProjectForUser(ownerId, projectId);

  return listApiKeysByProject(projectId);
}

export async function revokeApiKeyForProject(ownerId: string, projectId: string, apiKeyId: string) {
  await getProjectForUser(ownerId, projectId);

  const result = await revokeApiKey({
    id: apiKeyId,
    projectId,
  });

  if (result.count === 0) {
    throw new ApiKeyNotFoundError();
  }
}

export async function verifyApiKey(rawKey: string) {
  const apiKey = await findActiveApiKeyByHash(hashApiKey(rawKey));

  if (!apiKey) {
    return null;
  }

  await touchApiKeyLastUsedAt(apiKey.id);

  return apiKey;
}
