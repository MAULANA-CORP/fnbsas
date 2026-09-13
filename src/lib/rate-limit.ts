import { getPrisma } from "@/lib/prisma";
import { runWithoutTenant } from "@/lib/tenant";

export async function kenaRateLimit(key: string, maks: number, jendelaMs: number) {
  return runWithoutTenant(async () => {
    const prisma = getPrisma();
    const now = new Date();
    const rec = await prisma.rateLimit.findUnique({ where: { key } });
    if (!rec || rec.sampai < now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, n: 1, sampai: new Date(now.getTime() + jendelaMs) },
        update: { n: 1, sampai: new Date(now.getTime() + jendelaMs) },
      });
      return false;
    }
    const next = rec.n + 1;
    await prisma.rateLimit.update({ where: { key }, data: { n: next } });
    return next > maks;
  });
}

export async function resetRateLimit(key: string) {
  return runWithoutTenant(() => getPrisma().rateLimit.deleteMany({ where: { key } }));
}
