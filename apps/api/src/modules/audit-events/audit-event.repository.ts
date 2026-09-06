import { prisma } from "@pr/database";

export async function listAuditEventsByProject(projectId: string) {
  return prisma.auditEvent.findMany({
    where: {
      projectId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
}
