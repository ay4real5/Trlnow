const fs = require("fs");
const path = require("path");

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
