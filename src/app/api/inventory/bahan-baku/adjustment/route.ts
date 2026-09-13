import { NextResponse } from "next/server";
import { withOwnerProduksi, apiError, catatAudit } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";

/** POST /api/inventory/bahan-baku/adjustment — koreksi stok manual (wajib alasan). OWNER & PRODUKSI saja. */
export const POST = withOwnerProduksi(async (user, req) => {
  try {
    const body = await req.json();
    const bahanBakuId = String(body.itemId ?? "").trim();
    const tipe = body.tipe === "IN" || body.tipe === "OUT" ? body.tipe : null;
    const qty = Number(body.qty);
    const alasan = typeof body.alasan === "string" ? body.alasan.trim() : "";

    if (!bahanBakuId) return NextResponse.json({ error: "Bahan baku wajib dipilih." }, { status: 400 });
    if (!tipe) return NextResponse.json({ error: "Tipe penyesuaian wajib IN atau OUT." }, { status: 400 });
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: "Qty penyesuaian harus lebih dari 0." }, { status: 400 });
    }
    if (!alasan) return NextResponse.json({ error: "Alasan penyesuaian wajib diisi." }, { status: 400 });

    const prisma = getPrisma();

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.bahanBaku.findUnique({ where: { id: bahanBakuId } });
      if (!item) throw new Error("Bahan baku tidak ditemukan.");

      if (tipe === "OUT") {
        const res = await tx.bahanBaku.updateMany({
          where: { id: bahanBakuId, stok: { gte: qty } },
          data: { stok: { decrement: qty } },
        });
        if (res.count === 0) {
          throw new Error(
            `Stok ${item.nama} tidak cukup untuk pengurangan (tersedia ${Number(item.stok)} ${item.satuan}).`
          );
        }
      } else {
        await tx.bahanBaku.update({
          where: { id: bahanBakuId },
          data: { stok: { increment: qty } },
        });
      }

      const updated = await tx.bahanBaku.findUnique({ where: { id: bahanBakuId } });
      if (!updated) throw new Error("Bahan baku tidak ditemukan.");

      await tx.stokMovementBahanBaku.create({
        data: {
          bahanBakuId,
          tipe,
          qty,
          sumber: "ADJUSTMENT",
          keterangan: alasan,
        },
      });

      return updated;
    });

    await catatAudit({
      userId: user.id,
      aksi: "ADJUSTMENT",
      entitas: "BahanBaku",
      entitasId: bahanBakuId,
      detail: { tipe, qty, alasan },
    });

    return NextResponse.json({ data: { stok: Number(result.stok) } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
    return apiError(error);
  }
});
