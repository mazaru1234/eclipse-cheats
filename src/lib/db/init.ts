import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";
import { seedAdminIfNeeded, seedDemoData } from "../services/users";

let initialized = false;

export async function initDatabase() {
  if (initialized) return;
  initialized = true;

  try {
    migrate(db, { migrationsFolder: "./drizzle" });
    await seedAdminIfNeeded();
    await seedDemoData();
  } catch (error) {
    console.error("Database init error:", error);
  }
}
