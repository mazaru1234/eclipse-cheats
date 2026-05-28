import "dotenv/config";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db, sqlite } from "./index";
import { seedAdminIfNeeded, seedDemoData } from "../services/users";

async function main() {
  migrate(db, { migrationsFolder: "./drizzle" });
  await seedAdminIfNeeded();
  await seedDemoData();
  console.log("Database seeded successfully");
  sqlite.close();
}

main().catch(console.error);
