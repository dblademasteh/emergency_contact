import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";

const KEYLEN = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");

  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const hash = hashPassword("admin123");
  await p.admin.update({ where: { username: "admin1" }, data: { passwordHash: hash } });
  console.log("admin1 password set to: admin123");
  await p.$disconnect();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
