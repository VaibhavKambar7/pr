import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@pr/database";

type CreateRefreshTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createRefreshToken(input: CreateRefreshTokenInput) {
  return prisma.refreshToken.create({
    data: {
      userId: input.userId,
      tokenHash: input.tokenHash,
      hash: input.tokenHash,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    },
  });
}

export async function findRefreshTokenByHash(tokenHash: string) {
  return prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: true,
    },
  });
}

export async function revokeRefreshToken(id: string) {
  return prisma.refreshToken.update({
    where: {
      id,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function revokeUserRefreshTokens(userId: string) {
  return prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
