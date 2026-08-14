import bcrypt from "bcrypt";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createUser, findUserByEmail, findUserById } from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const SALT_ROUNDS = 10;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

type AuthUser = {
  id: string;
  email: string;
};

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return process.env.JWT_SECRET;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

export function signAuthToken(user: AuthUser) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + TOKEN_TTL_SECONDS;
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      iat: issuedAt,
      exp: expiresAt,
    }),
  );
  const signature = createHmac("sha256", getJwtSecret()).update(`${header}.${payload}`).digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthUser | null {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getJwtSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  let decodedPayload: {
    sub?: string;
    email?: string;
    exp?: number;
  };

  try {
    decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as typeof decodedPayload;
  } catch {
    return null;
  }

  if (!decodedPayload.sub || !decodedPayload.email || !decodedPayload.exp) {
    return null;
  }

  if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    id: decodedPayload.sub,
    email: decodedPayload.email,
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
    accessToken: signAuthToken(user),
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
    accessToken: signAuthToken(user),
  };
}

export async function getAuthenticatedUser(userId: string) {
  return findUserById(userId);
}
