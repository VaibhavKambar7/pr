import type { FastifyReply, FastifyRequest } from "fastify";
import { sendPreviewError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import { previewPromptSchema } from "./preview.schema.js";
import { previewPromptVersion } from "./preview.service.js";

type PreviewPromptVersionParams = {
  projectId: string;
  promptId: string;
  versionId: string;
};

export async function previewPromptVersionController(
  request: FastifyRequest<{ Params: PreviewPromptVersionParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  const parsedBody = previewPromptSchema.safeParse(request.body);

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
    const result = await previewPromptVersion(
      user.id,
      request.params.projectId,
      request.params.promptId,
      request.params.versionId,
      parsedBody.data,
    );

    return reply.code(200).send(result);
  } catch (error) {
    return sendPreviewError(reply, error);
  }
}
