import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/* The Neon Postgres database is shared with the Abims2026 wedding site
   (which keeps its tables in the default "public" schema). TrlNow must
   only ever touch its own "trlnow" schema — on 2026-07-19 a deploy ran
   `prisma db push` against "public" and dropped the wedding RSVP tables.
   SQLite URLs (local dev) pass through untouched. */
export function trlnowDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("postgres") || url.includes("schema=")) return url;
  return url + (url.includes("?") ? "&" : "?") + "schema=trlnow";
}

function createClient() {
  const url = trlnowDatabaseUrl();
  const options: Prisma.PrismaClientOptions = { log: ["error"] };
  if (url) options.datasources = { db: { url } };
  return new PrismaClient(options);
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
