import { AuditAction, Prisma, prisma } from "@pr/database";
import type { CreateToolInput, UpdateToolInput } from "./tool.schema.js";

type CreateToolRecordInput = CreateToolInput & {
  projectId: string;
  ownerId: string;
  slug: string;
};

type ToolAuditSnapshot = {
  name: string;
  slug: string;
  description: string;
  inputSchema: Prisma.JsonValue;
};

export function isToolUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toToolAuditSnapshot(tool: ToolAuditSnapshot): Prisma.InputJsonObject {
  return {
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    inputSchema: tool.inputSchema as Prisma.InputJsonValue,
  };
}

async function createToolAuditEvent(
  tx: Prisma.TransactionClient,
  input: {
    projectId: string;
    actorId: string;
    action: AuditAction;
    entityId: string;
    before: ToolAuditSnapshot | null;
    after: ToolAuditSnapshot | null;
  },
) {
  await tx.auditEvent.create({
    data: {
      projectId: input.projectId,
      actorId: input.actorId,
      action: input.action,
      entityType: "tool",
      entityId: input.entityId,
      before: input.before ? toToolAuditSnapshot(input.before) : undefined,
      after: input.after ? toToolAuditSnapshot(input.after) : undefined,
    },
  });
}

export async function createTool(input: CreateToolRecordInput) {
  return prisma.$transaction(async (tx) => {
    const tool = await tx.tool.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        inputSchema: input.inputSchema as Prisma.InputJsonValue,
      },
    });

    await createToolAuditEvent(tx, {
      projectId: input.projectId,
      actorId: input.ownerId,
      action: AuditAction.TOOL_CREATED,
      entityId: tool.id,
      before: null,
      after: tool,
    });

    return tool;
  });
}

export async function findToolBySlug(projectId: string, slug: string) {
  return prisma.tool.findUnique({
    where: {
      projectId_slug: {
        projectId,
        slug,
      },
    },
  });
}

export async function findToolById(projectId: string, toolId: string) {
  return prisma.tool.findFirst({
    where: {
      id: toolId,
      projectId,
    },
  });
}

export async function updateTool(
  projectId: string,
  toolId: string,
  ownerId: string,
  input: UpdateToolInput & { slug?: string },
) {
  return prisma.$transaction(async (tx) => {
    const existingTool = await tx.tool.findFirst({
      where: { id: toolId, projectId },
    });

    if (!existingTool) {
      return { count: 0 };
    }

    const updatedTool = await tx.tool.update({
      where: { id: toolId },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        inputSchema: input.inputSchema as Prisma.InputJsonValue | undefined,
      },
    });

    await createToolAuditEvent(tx, {
      projectId,
      actorId: ownerId,
      action: AuditAction.TOOL_UPDATED,
      entityId: toolId,
      before: existingTool,
      after: updatedTool,
    });

    return { count: 1 };
  });
}

export async function deleteTool(projectId: string, toolId: string, ownerId: string) {
  return prisma.$transaction(async (tx) => {
    const existingTool = await tx.tool.findFirst({
      where: { id: toolId, projectId },
    });

    if (!existingTool) {
      return { count: 0 };
    }

    await tx.tool.delete({ where: { id: toolId } });

    await createToolAuditEvent(tx, {
      projectId,
      actorId: ownerId,
      action: AuditAction.TOOL_DELETED,
      entityId: toolId,
      before: existingTool,
      after: null,
    });

    return { count: 1 };
  });
}

export async function listToolsByProject(projectId: string) {
  return prisma.tool.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}
