import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DATABASE_URL ?? "./data/eclipse.db";
const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
const sqlite = new Database(absolutePath);

const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log("tables:", tables.map((t) => t.name).join(", "));

try {
  const migrations = sqlite.prepare("SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY created_at").all();
  console.log("migrations count:", migrations.length);
} catch (e) {
  console.log("no migrations table");
}

sqlite.close();
