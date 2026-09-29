import { getProjectForUser } from "../projects/project.service.js";
import { listToolsByProject } from "../tools/tool.repository.js";
import { RuntimeProjectAccessError, type RuntimeAuthContext } from "./runtime.service.js";

async function ensureRuntimeProjectAccess(context: RuntimeAuthContext, projectId: string) {
  if (context.type === "apiKey") {
    if (context.projectId !== projectId) {
      throw new RuntimeProjectAccessError();
    }

    return;
  }

  await getProjectForUser(context.userId, projectId);
}

export async function listRuntimeTools(context: RuntimeAuthContext, projectId: string) {
  await ensureRuntimeProjectAccess(context, projectId);
  return listToolsByProject(projectId);
}
