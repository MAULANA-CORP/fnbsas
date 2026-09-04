import { NextResponse } from "next/server";
import { withPlatformAdmin, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { awalBulanBerikutnyaWIB, awalBulanWIB, sisaHariPaket } from "@/lib/subscription";

export const GET = withPlatformAdmin(async () => {
  try {
    const prisma = getPrisma();
    const start = awalBulanWIB();
    const end = awalBulanBerikutnyaWIB();
    const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [tenants, pending, omzetRows] = await Promise.all([
      prisma.tenant.findMany({
        select: {
          id: true,
          namaUsaha: true,
          tier: true,
          periode: true,
          paidUntil: true,
          isSuspended: true,
          status: true,
        },
      }),
      prisma.pembayaranLangganan.count({ where: { status: "PENDING" } }),
      prisma.pembayaranLangganan.findMany({
        where: { status: "APPROVED", createdAt: { gte: start, lt: end } },
        select: { jumlah: true },
      }),
    ]);

    const hampirHabis = tenants
      .filter((t) => t.tier !== "FREE" && t.paidUntil && t.paidUntil <= in7 && t.paidUntil >= new Date())
      .map((t) => ({
        id: t.id,
        namaUsaha: t.namaUsaha,
        tier: t.tier,
        periode: t.periode,
        paidUntil: t.paidUntil,
        sisaHari: sisaHariPaket(t.paidUntil),
      }));

    return NextResponse.json({
      jumlahToko: tenants.length,
      free: tenants.filter((t) => t.tier === "FREE").length,
      pro: tenants.filter((t) => t.tier === "PRO").length,
      business: tenants.filter((t) => t.tier === "BUSINESS").length,
      suspend: tenants.filter((t) => t.isSuspended).length,
      pendingBayar: pending,
      omzetBulanIni: omzetRows.reduce((s, r) => s + Number(r.jumlah), 0),
      hampirHabis,
    });
  } catch (error) {
    return apiError(error);
  }
});
