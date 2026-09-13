import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { withOwner, apiError } from "@/lib/api-helpers";
import { parseTanggalAkhir, parseTanggalAwal } from "@/lib/period";

// GET /api/owner/audit-log — riwayat AuditLog, bisa difilter (entitas, user, rentang tanggal) + paginasi.
export const GET = withOwner(async (_user, req) => {
  try {
    const { searchParams } = new URL(req.url);
    const entitas = searchParams.get("entitas")?.trim();
    const userId = searchParams.get("userId")?.trim();
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 25) || 25));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (entitas) where.entitas = { contains: entitas, mode: "insensitive" };
    if (userId) where.userId = userId;
    if (dari || sampai) {
      where.createdAt = {};
      const awal = parseTanggalAwal(dari);
      const akhir = parseTanggalAkhir(sampai);
      if (awal) where.createdAt.gte = awal;
      if (akhir) where.createdAt.lte = akhir;
    }

    const prisma = getPrisma();
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, nama: true, username: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  } catch (error) {
    return apiError(error);
  }
});
