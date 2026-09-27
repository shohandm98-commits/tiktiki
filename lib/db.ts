import { promises as fs } from "fs";
import path from "path";

export type User = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  bio: string;
  createdAt: string;
};

type Session = { tokenHash: string; userId: string; expiresAt: string };

type Database = { users: User[]; sessions: Session[] };

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dbFile);
  } catch {
    await fs.writeFile(dbFile, JSON.stringify({ users: [], sessions: [] }, null, 2));
  }
}

export async function readDb(): Promise<Database> {
  await ensureDb();
  return JSON.parse(await fs.readFile(dbFile, "utf8"));
}

export async function writeDb(db: Database) {
  await ensureDb();
  const temp = `${dbFile}.tmp`;
  await fs.writeFile(temp, JSON.stringify(db, null, 2));
  await fs.rename(temp, dbFile);
}
