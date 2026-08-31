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

export async function rotateRefreshToken(input: {
  oldTokenHash: string;
  newTokenHash: string;
  expiresAt: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.refreshToken.findUnique({
      where: { tokenHash: input.oldTokenHash },
    });

    if (!existing || existing.revokedAt || existing.expiresAt <= new Date()) {
      return null;
    }

    const revoked = await tx.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revoked.count === 0) {
      return null;
    }

    return tx.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: input.newTokenHash,
        expiresAt: input.expiresAt,
        createdAt: new Date(),
      },
    });
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
