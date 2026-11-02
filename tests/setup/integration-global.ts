import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export default async function setup() {
  const url = process.env.DATABASE_URL;

  if (!url?.includes("_test")) {
    throw new Error(
      "Refusing to run integration tests: DATABASE_URL is not a test database",
    );
  }

  const pool = new Pool({ connectionString: url });

  // Test DB disposable hai: har run fresh schema se shuru hota hai
  await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
  await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
  await pool.query("CREATE SCHEMA public");

  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
}