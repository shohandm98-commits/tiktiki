import crypto from "crypto";
import { cookies } from "next/headers";
import { readDb, writeDb, User } from "./db";

const COOKIE_NAME = "tiktiki_session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const db = await readDb();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt) > new Date());
  db.sessions.push({ tokenHash: hashToken(token), userId, expiresAt });
  await writeDb(db);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const db = await readDb();
    db.sessions = db.sessions.filter((s) => s.tokenHash !== hashToken(token));
    await writeDb(db);
  }
  cookieStore.set(COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const db = await readDb();
  const session = db.sessions.find((s) => s.tokenHash === hashToken(token));
  if (!session || new Date(session.expiresAt) <= new Date()) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

export function publicUser(user: User) {
  return { id: user.id, username: user.username, email: user.email, bio: user.bio, createdAt: user.createdAt };
}
