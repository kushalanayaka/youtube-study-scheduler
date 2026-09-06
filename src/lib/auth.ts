import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET || "fallback-secret-for-development-key-32-chars-long!";
  const safeSecret = raw.length >= 32 ? raw : raw.padEnd(32, "x");
  return new TextEncoder().encode(safeSecret);
}

const TOKEN_COOKIE_NAME = "token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, getJwtSecret());
    return verified.payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

export async function signResetToken(payload: { userId: string; email: string; passwordHash?: string }): Promise<string> {
  const pwdVer = (payload.passwordHash || "").slice(-12);
  return new SignJWT({ userId: payload.userId, email: payload.email, pwdVer })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getJwtSecret());
}

export async function verifyResetToken(token: string) {
  try {
    const verified = await jwtVerify(token, getJwtSecret());
    return verified.payload as { userId: string; email: string; pwdVer?: string };
  } catch {
    return null;
  }
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      telegramChatId: true,
      telegramLinked: true,
      emailVerified: true,
      timezone: true,
      createdAt: true,
    },
  });

  return user;
}
