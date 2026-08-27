import bcrypt from "bcrypt";
import { createUser, findUserByEmail, findUserById } from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const SALT_ROUNDS = 10;
export const AUTH_TOKEN_EXPIRES_IN = "7d";

export function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return process.env.JWT_SECRET;
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
