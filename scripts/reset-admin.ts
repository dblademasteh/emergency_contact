import "dotenv/config";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/passwords";

async function main() {
  const hash = hashPassword("admin123");
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.username, "admin1"))
    .limit(1);
  if (!admin) {
    console.error("admin1 not found");
    process.exit(1);
  }
  await db
    .update(admins)
    .set({ passwordHash: hash })
    .where(eq(admins.username, "admin1"));
  console.log("admin1 password set to: admin123");
}

main()
  .then(() => db.$client.end())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });