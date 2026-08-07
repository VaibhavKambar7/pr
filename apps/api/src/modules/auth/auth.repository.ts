import { prisma } from "@pr/database";

type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export async function createUser(user: CreateUserInput) {
  return prisma.user.create({
    data: {
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
