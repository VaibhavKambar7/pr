import bcrypt from "bcrypt";
import {
  type LoginInput,
  type LogoutSessionInput,
  type RefreshSessionInput,
  type RegisterInput,
} from "./auth.schema.js";
import {
  createRefreshToken,
  findRefreshTokenByHash,
  generateRefreshToken,
  hashRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from "./auth.refresh-token.repository.js";
import { createUser, findUserByEmail, findUserById } from "./auth.repository.js";

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_TTL_DAYS = 7;
export const AUTH_TOKEN_EXPIRES_IN = "15m";

export function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return process.env.JWT_SECRET;
}

export function getRefreshTokenExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

  return expiresAt;
}

export async function createRefreshSession(userId: string) {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  await createRefreshToken({
    userId,
    tokenHash,
    expiresAt: getRefreshTokenExpiresAt(),
  });

  return refreshToken;
}

export async function refreshAuthSession(input: RefreshSessionInput) {
  const tokenHash = hashRefreshToken(input.refreshToken);
  const nextToken = generateRefreshToken();

  const tokenRecord = await rotateRefreshToken({
    oldTokenHash: tokenHash,
    newTokenHash: hashRefreshToken(nextToken),
    expiresAt: getRefreshTokenExpiresAt(),
  });

  if (!tokenRecord) {
    throw new Error("invalid refresh token");
  }

  const user = await findUserById(tokenRecord.userId);

  if (!user) {
    throw new Error("invalid refresh token");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    refreshToken: nextToken,
  };
}

export async function logoutAuthSession(input: LogoutSessionInput) {
  const tokenHash = hashRefreshToken(input.refreshToken);
  const tokenRecord = await findRefreshTokenByHash(tokenHash);

  if (tokenRecord && !tokenRecord.revokedAt) {
    await revokeRefreshToken(tokenRecord.id);
  }

  return {
    success: true,
  };
}

export async function registerUser(data: RegisterInput) {
  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new Error("user already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await createUser({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function loginUser(data: LoginInput) {
  const user = await findUserByEmail(data.email);

  if (!user) {
    throw new Error("invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("invalid email or password");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function getAuthenticatedUser(userId: string) {
  return findUserById(userId);
}
