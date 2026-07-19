const fs = require("fs");
const path = require("path");

/* `--push` mode: run `prisma db push` against TrlNow's own "trlnow" Postgres
   schema. The Neon database is shared with the Abims2026 wedding site, whose
   tables live in "public" — pushing there drops them (happened 2026-07-19,
   wiping the wedding RSVP and blessings tables). Never push to "public". */
if (process.argv.includes("--push")) {
  const { spawnSync } = require("child_process");
  let url = process.env.DATABASE_URL || "";
  if (url.startsWith("postgres") && !url.includes("schema=")) {
    url += (url.includes("?") ? "&" : "?") + "schema=trlnow";
  }
  if (url.startsWith("postgres") && !url.includes("schema=trlnow")) {
    console.error(
      "[prebuild --push] REFUSING to push: postgres URL is missing schema=trlnow. " +
        "This database is shared with the Abims2026 wedding site (tables in 'public'); " +
        "pushing without the trlnow schema would drop them."
    );
    process.exit(1);
  }
  const res = spawnSync("prisma", ["db", "push", "--accept-data-loss"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
    shell: process.platform === "win32",
  });
  process.exit(res.status === null ? 1 : res.status);
}

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

// On Vercel (or any environment that sets DB_PROVIDER=postgresql), switch the provider
if (process.env.DB_PROVIDER === "postgresql") {
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema);
    console.log("[prebuild] Switched Prisma provider to postgresql");
  }
} else if (process.env.VERCEL || process.env.VERCEL_ENV) {
  // Fallback: if VERCEL env is detected but DB_PROVIDER is missing, switch to postgresql
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema);
    console.log("[prebuild] Vercel env detected — switched Prisma provider to postgresql");
  }
} else {
  console.log("[prebuild] Keeping Prisma provider as sqlite");
}
