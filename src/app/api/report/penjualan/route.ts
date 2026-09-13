import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { withOwnerFinance, catatAudit, apiError } from "@/lib/api-helpers";
import { awalBulanIni, akhirHariIni, parseTanggalAwal, parseTanggalAkhir } from "@/lib/period";
import type { Prisma } from "@/generated/prisma/client";

// GET /api/report/penjualan?start&end&outletId — gabungan POS + B2B per periode
export const GET = withOwnerFinance(async (user, req) => {
  try {
    const { searchParams } = new URL(req.url);
    const start = parseTanggalAwal(searchParams.get("start")) ?? awalBulanIni();
    const end = parseTanggalAkhir(searchParams.get("end")) ?? akhirHariIni();
    const outletId = searchParams.get("outletId") || undefined;

    const prisma = getPrisma();
    const wherePOS: Prisma.OrderPOSWhereInput = {
      createdAt: { gte: start, lte: end },
      ...(outletId ? { outletId } : {}),
    };
    const whereB2B: Prisma.OrderB2BWhereInput = {
      createdAt: { gte: start, lte: end },
      status: { notIn: ["BATAL", "DRAFT"] },
      ...(outletId ? { outletId } : {}),
    };
    const [orderPOS, orderB2B, aggPOS, aggB2B] = await Promise.all([
      prisma.orderPOS.findMany({ take: 200, where: wherePOS,
        include: { customer: { select: { nama: true } }, outlet: { select: { nama: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.orderB2B.findMany({ take: 200, where: whereB2B,
        include: { agen: { select: { nama: true } }, outlet: { select: { nama: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.orderPOS.aggregate({ _sum: { total: true }, where: wherePOS }),
      prisma.orderB2B.aggregate({ _sum: { total: true }, where: whereB2B }),
    ]);

    const baris = [
      ...orderPOS.map((o) => ({
        id: o.id,
        jenis: "POS" as const,
        nomor: o.nomor,
        tanggal: o.createdAt,
        pihak: o.customer.nama,
        outlet: o.outlet.nama,
        metodeBayar: o.metodeBayar,
        statusBayar: o.statusBayar,
        total: Number(o.total),
      })),
      ...orderB2B.map((o) => ({
        id: o.id,
        jenis: "B2B" as const,
        nomor: o.nomor,
        tanggal: o.createdAt,
        pihak: o.agen.nama,
        outlet: o.outlet.nama,
        metodeBayar: o.metodeBayar,
        statusBayar: o.statusBayar,
        total: Number(o.total),
      })),
    ].sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());

    const totalPOS = Number(aggPOS._sum.total ?? 0);
    const totalB2B = Number(aggB2B._sum.total ?? 0);

    if (searchParams.get("export") === "1") {
      await catatAudit({
        userId: user.id,
        aksi: "EXPORT",
        entitas: "LaporanPenjualan",
        detail: { start: start.toISOString(), end: end.toISOString(), outletId: outletId ?? null },
      });
    }

    return NextResponse.json({
      periode: { start: start.toISOString(), end: end.toISOString() },
      totalPOS,
      totalB2B,
      total: totalPOS + totalB2B,
      jumlahOrder: baris.length,
      baris,
    });
  } catch (error) {
    return apiError(error);
  }
});
