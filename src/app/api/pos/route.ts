import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { parseTanggalAkhir, parseTanggalAwal } from "@/lib/period";
import { withRole, withOwnerSales, apiError } from "@/lib/api-helpers";
import { buatOrderPOS, serializeOrderPOS, PosError, type CreateOrderPOSInput } from "@/lib/pos";

// GET /api/pos — daftar order POS (OWNER/SALES/FINANCE bisa lihat)
export const GET = withRole(["OWNER", "SALES", "FINANCE"], async (_user, req) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const outletId = searchParams.get("outletId");
    const metodeBayar = searchParams.get("metodeBayar");
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 50) || 50));
    const termasukBatal = searchParams.get("termasukBatal") === "1";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (!termasukBatal) where.status = { not: "BATAL" };
    if (status && ["LUNAS", "PARSIAL", "BELUM_BAYAR"].includes(status)) {
      where.statusBayar = status;
    }
    if (outletId) where.outletId = outletId;
    if (metodeBayar && ["CASH", "TRANSFER_QRIS", "KREDIT"].includes(metodeBayar)) {
      where.metodeBayar = metodeBayar;
    }
    if (dari || sampai) {
      const rentang: Record<string, Date> = {};
      if (dari) rentang.gte = parseTanggalAwal(dari) ?? new Date(dari);
      if (sampai) rentang.lte = parseTanggalAkhir(sampai) ?? new Date(`${sampai}T23:59:59.999+07:00`);
      where.createdAt = rentang;
    }
    if (search) {
      where.OR = [
        { nomor: { contains: search, mode: "insensitive" } },
        { customer: { nama: { contains: search, mode: "insensitive" } } },
      ];
    }

    const prisma = getPrisma();
    const [orders, total] = await Promise.all([
      prisma.orderPOS.findMany({
        where,
        include: {
          customer: true,
          outlet: true,
          user: true,
          items: { include: { produkJadi: true } },
          piutang: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.orderPOS.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map(serializeOrderPOS),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return apiError(error);
  }
});

// POST /api/pos — buat order POS baru (hanya OWNER/SALES)
export const POST = withOwnerSales(async (user, req) => {
  try {
    const body = (await req.json()) as CreateOrderPOSInput;
    const order = await buatOrderPOS(user, body);
    return NextResponse.json({ order: serializeOrderPOS(order) }, { status: 201 });
  } catch (error) {
    if (error instanceof PosError) {
      return NextResponse.json({ error: error.message, type: "validation" }, { status: 400 });
    }
    return apiError(error);
  }
});
