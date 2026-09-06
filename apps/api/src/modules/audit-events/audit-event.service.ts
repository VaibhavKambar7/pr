import { getProjectForUser } from "../projects/project.service.js";
import { listAuditEventsByProject } from "./audit-event.repository.js";

export async function listAuditEventsForProject(ownerId: string, projectId: string) {
  await getProjectForUser(ownerId, projectId);

  return listAuditEventsByProject(projectId);
}
