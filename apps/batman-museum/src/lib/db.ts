import { Pool, types } from "pg";

// pg parses DATE (oid 1082) into a JS Date at local midnight; that then
// stringifies as "Thu Mar 30", breaking year parsing downstream. Keep the
// raw "YYYY-MM-DD" text the column already stores.
types.setTypeParser(types.builtins.DATE, (v) => v);

declare global {
  // Reuse the pool across Next.js hot reloads and route invocations.
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

// Inside a container, localhost from .env.local must point at the host.
function applyHostOverride(url: string): string {
  const override = process.env.PGHOST_OVERRIDE;
  return override ? url.replace("@localhost:", `@${override}:`) : url;
}

export function getPool(): Pool {
  if (!global.pgPool) {
    const url = process.env.DATABASE_URL;
    // Local dev uses DATABASE_URL; in-cluster relies on the standard
    // PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE vars that pg reads natively.
    global.pgPool = url
      ? new Pool({ connectionString: applyHostOverride(url), max: 5 })
      : new Pool({ max: 5 });
  }
  return global.pgPool;
}
