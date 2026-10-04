import { getProjectForUser } from "../projects/project.service.js";
import { findToolBySlug, listToolsByProject } from "../tools/tool.repository.js";
import { ToolNotFoundError } from "../tools/tool.service.js";
import { RuntimeProjectAccessError, type RuntimeAuthContext } from "./runtime.service.js";
import { validateToolInput } from "../../shared/tool-input-validation.js";

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

export async function getRuntimeTool(
  context: RuntimeAuthContext,
  projectId: string,
  toolSlug: string,
) {
  await ensureRuntimeProjectAccess(context, projectId);

  const tool = await findToolBySlug(projectId, toolSlug);

  if (!tool) {
    throw new ToolNotFoundError();
  }

  return tool;
}

export async function validateRuntimeToolInput(
  context: RuntimeAuthContext,
  projectId: string,
  toolSlug: string,
  input: Record<string, unknown>,
) {
  const tool = await getRuntimeTool(context, projectId, toolSlug);
  validateToolInput(tool.inputSchema as Record<string, unknown>, input);

  return {
    tool,
    valid: true as const,
  };
}
