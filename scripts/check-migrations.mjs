import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_URL ?? "./data/eclipse.db";
const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
const sqlite = new Database(absolutePath);

const migrations = sqlite
  .prepare("SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY created_at")
  .all();

console.log("Applied migrations:", migrations.length);
for (const row of migrations) {
  console.log(row.id, row.created_at);
}

const journal = JSON.parse(fs.readFileSync("./drizzle/meta/_journal.json", "utf8"));
console.log("\nJournal entries:", journal.entries.map((e) => e.tag).join(", "));

sqlite.close();
