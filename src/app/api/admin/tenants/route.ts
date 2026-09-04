import { NextResponse } from "next/server";
import { withPlatformAdmin, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { sisaHariPaket } from "@/lib/subscription";

export const GET = withPlatformAdmin(async (_user, req) => {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    const prisma = getPrisma();
    const tenants = await prisma.tenant.findMany({
      where: q
        ? {
            OR: [
              { namaUsaha: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { users: { some: { username: { contains: q.toLowerCase(), mode: "insensitive" } } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        users: { where: { role: "OWNER" }, select: { username: true, nama: true }, take: 3 },
        _count: { select: { users: true, outlets: true } },
        pembayaranLangganan: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
    });

    return NextResponse.json({
      tenants: tenants.map((t) => ({
        id: t.id,
        namaUsaha: t.namaUsaha,
        slug: t.slug,
        tier: t.tier,
        periode: t.periode,
        status: t.status,
        paidUntil: t.paidUntil,
        sisaHari: sisaHariPaket(t.paidUntil),
        isSuspended: t.isSuspended,
        catatanInternal: t.catatanInternal,
        createdAt: t.createdAt,
        ownerUsername: t.users[0]?.username ?? null,
        jumlahUser: t._count.users,
        jumlahOutlet: t._count.outlets,
        pendingPembayaran: t.pembayaranLangganan.length,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
});
