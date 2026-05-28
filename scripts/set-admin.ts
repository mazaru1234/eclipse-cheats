import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "mazaru05@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "fa332Sss";
  const hash = await hashPassword(password);

  const [existing] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ email, passwordHash: hash, username: "Admin" })
      .where(eq(users.id, existing.id));
    console.log(`Updated admin: ${existing.email} -> ${email}`);
    return;
  }

  console.log("No admin user found");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
