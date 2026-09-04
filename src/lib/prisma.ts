import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TENANTED_MODELS, getTenantContext, injectWhere } from "@/lib/tenant";

const globalForPrisma = globalThis as unknown as { prisma?: AppPrisma; prismaBase?: PrismaClient };

const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);
const UNIQUE_READ = new Set(["findUnique", "findUniqueOrThrow"]);
const UNIQUE_WRITE = new Set(["update", "delete"]);

function uncapitalize(name: string) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString?.startsWith("postgres")) {
    throw new Error("DATABASE_URL harus berupa koneksi PostgreSQL");
  }
  const base = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  globalForPrisma.prismaBase = base;

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const ctx = getTenantContext();
          const skip = !ctx || ctx.skip || !ctx.tenantId || !TENANTED_MODELS.has(model);
          if (skip) return query(args);

          const tenantId = ctx.tenantId;
          if (!tenantId) return query(args);
          const a = args as Record<string, unknown>;

          // Login / cek username global — jangan di-scope tenant
          if (
            model === "User" &&
            a?.where &&
            typeof a.where === "object" &&
            a.where !== null &&
            "username" in (a.where as object)
          ) {
            return query(args);
          }

          if (WHERE_OPS.has(operation)) {
            a.where = injectWhere(a.where, tenantId);
            return query(a);
          }

          if (operation === "create") {
            const data = (a.data ?? {}) as Record<string, unknown>;
            if (data.tenantId === undefined) a.data = { tenantId, ...data };
            return query(a);
          }

          if (operation === "createMany" || operation === "createManyAndReturn") {
            const data = a.data;
            if (Array.isArray(data)) {
              a.data = data.map((row) => {
                const r = (row ?? {}) as Record<string, unknown>;
                return r.tenantId === undefined ? { tenantId, ...r } : r;
              });
            }
            return query(a);
          }

          if (operation === "upsert") {
            const create = (a.create ?? {}) as Record<string, unknown>;
            if (create.tenantId === undefined) a.create = { tenantId, ...create };
            const result = (await query(a)) as { tenantId?: string } | null;
            if (result?.tenantId && result.tenantId !== tenantId) {
              throw new Error("Data tidak ditemukan");
            }
            return result;
          }

          if (UNIQUE_READ.has(operation)) {
            const result = (await query(args)) as { tenantId?: string | null } | null;
            if (result && result.tenantId && result.tenantId !== tenantId) {
              if (operation === "findUniqueOrThrow") throw new Error("Data tidak ditemukan");
              return null;
            }
            return result;
          }

          if (UNIQUE_WRITE.has(operation)) {
            const delegate = (base as unknown as Record<string, { findFirst: (x: unknown) => Promise<{ id: string } | null> }>)[
              uncapitalize(model)
            ];
            const existing = await delegate.findFirst({
              where: { ...(a.where as object), tenantId },
              select: { id: true },
            });
            if (!existing) throw new Error("Data tidak ditemukan");
            return query(args);
          }

          return query(args);
        },
      },
    },
  });
}

export type AppPrisma = ReturnType<typeof createPrismaClient>;

/**
 * Singleton malas — client baru dibuat saat pertama dipakai, supaya
 * `next build` tidak gagal ketika DATABASE_URL belum tersedia.
 */
export function getPrisma(): AppPrisma {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createPrismaClient();
  return globalForPrisma.prisma;
}

/** Client tanpa filter tenant — hanya untuk seed / admin platform. */
export function getPrismaBase(): PrismaClient {
  getPrisma();
  return globalForPrisma.prismaBase!;
}

export { Prisma };
