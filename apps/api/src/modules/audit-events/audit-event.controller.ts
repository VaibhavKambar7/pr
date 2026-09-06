import type { FastifyReply, FastifyRequest } from "fastify";
import { sendProjectError } from "../../shared/errors.js";
import { requireUser } from "../../shared/http.js";
import { listAuditEventsForProject } from "./audit-event.service.js";

type ProjectParams = {
  projectId: string;
};

export async function listAuditEventsController(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const user = requireUser(request, reply);

  if (!user) {
    return;
  }

  try {
    const auditEvents = await listAuditEventsForProject(user.id, request.params.projectId);
    return reply.code(200).send({ auditEvents });
  } catch (error) {
    return sendProjectError(reply, error);
  }
}
