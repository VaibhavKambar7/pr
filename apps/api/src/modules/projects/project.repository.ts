import { AuditAction, prisma, type Prisma } from "@pr/database";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schema.js";

type CreateProjectRecordInput = CreateProjectInput & {
  ownerId: string;
  slug: string;
};

type ProjectIdentity = {
  id: string;
  ownerId: string;
};

type ProjectAuditSnapshot = {
  name: string;
  slug: string;
  description: string | null;
};

function toProjectAuditSnapshot(project: ProjectAuditSnapshot) {
  return {
    name: project.name,
    slug: project.slug,
    description: project.description,
  };
}

async function createProjectAuditEvent(
  tx: Prisma.TransactionClient,
  input: {
    projectId: string;
    actorId: string;
    action: AuditAction;
    before: ProjectAuditSnapshot | null;
    after: ProjectAuditSnapshot | null;
  },
) {
  await tx.auditEvent.create({
    data: {
      projectId: input.projectId,
      actorId: input.actorId,
      action: input.action,
      entityType: "project",
      entityId: input.projectId,
      before: input.before ? toProjectAuditSnapshot(input.before) : undefined,
      after: input.after ? toProjectAuditSnapshot(input.after) : undefined,
    },
  });
}

export async function createProject(input: CreateProjectRecordInput) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        ownerId: input.ownerId,
      },
    });

    await createProjectAuditEvent(tx, {
      projectId: project.id,
      actorId: input.ownerId,
      action: AuditAction.PROJECT_CREATED,
      before: null,
      after: project,
    });

    return project;
  });
}

export async function findProjectBySlug(ownerId: string, slug: string) {
  return prisma.project.findUnique({
    where: {
      ownerId_slug: {
        ownerId,
        slug,
      },
    },
  });
}

export async function listProjectsByOwner(ownerId: string) {
  return prisma.project.findMany({
    where: {
      ownerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findProjectById(input: ProjectIdentity) {
  return prisma.project.findFirst({
    where: {
      id: input.id,
      ownerId: input.ownerId,
    },
  });
}

export async function updateProject(input: ProjectIdentity & UpdateProjectInput) {
  return prisma.$transaction(async (tx) => {
    const existingProject = await tx.project.findFirst({
      where: {
        id: input.id,
        ownerId: input.ownerId,
      },
    });

    if (!existingProject) {
      return { count: 0 };
    }

    const updatedProject = await tx.project.update({
      where: {
        id: input.id,
      },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
      },
    });

    await createProjectAuditEvent(tx, {
      projectId: updatedProject.id,
      actorId: input.ownerId,
      action: AuditAction.PROJECT_UPDATED,
      before: existingProject,
      after: updatedProject,
    });

    return { count: 1 };
  });
}

export async function deleteProject(input: ProjectIdentity) {
  return prisma.project.deleteMany({
    where: {
      id: input.id,
      ownerId: input.ownerId,
    },
  });
}
