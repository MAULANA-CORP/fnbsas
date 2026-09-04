import { NextResponse } from "next/server";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { withOwner, catatAudit, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { type PaketBerbayar, type PeriodeLangganan } from "@/lib/subscription";
import { aktifkanGratisDenganVoucher, hitungTagihanLangganan } from "@/lib/langganan-bayar";
import { VoucherError } from "@/lib/voucher";

const MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MAX_BYTES = 5 * 1024 * 1024;

export const POST = withOwner(async (user, req) => {
  try {
    if (!user.tenantId) {
      return NextResponse.json({ error: "Akun tidak terikat ke toko" }, { status: 400 });
    }

    const form = await req.formData();
    const targetTier = String(form.get("targetTier") ?? "").toUpperCase() as PaketBerbayar;
    const periode = String(form.get("periode") ?? "").toUpperCase() as PeriodeLangganan;
    const catatan = String(form.get("catatan") ?? "").trim() || null;
    const kodeVoucher = String(form.get("kodeVoucher") ?? "").trim() || null;
    const file = form.get("bukti");

    if (targetTier !== "PRO" && targetTier !== "BUSINESS") {
      return NextResponse.json({ error: "Pilih paket PRO atau BUSINESS" }, { status: 400 });
    }
    if (periode !== "BULANAN" && periode !== "TAHUNAN") {
      return NextResponse.json({ error: "Pilih periode bulanan atau tahunan" }, { status: 400 });
    }

    const prismaAwal = getPrisma();
    const pendingAwal = await prismaAwal.pembayaranLangganan.findFirst({
      where: { tenantId: user.tenantId, status: "PENDING" },
    });
    if (pendingAwal) {
      return NextResponse.json(
        { error: "Masih ada pembayaran yang menunggu dicek. Tunggu konfirmasi admin dulu." },
        { status: 400 }
      );
    }

    const tagihan = await hitungTagihanLangganan({
      targetTier,
      periode,
      tenantId: user.tenantId,
      kodeVoucher,
    });

    if (tagihan.bayar === 0) {
      const pembayaran = await aktifkanGratisDenganVoucher({
        userId: user.id,
        tenantId: user.tenantId,
        targetTier,
        periode,
        tagihan,
      });
      await catatAudit({
        userId: user.id,
        aksi: "APPROVE",
        entitas: "PembayaranLangganan",
        entitasId: pembayaran.id,
        detail: { voucher: tagihan.kode, targetTier, periode },
      });
      return NextResponse.json({ gratis: true, pembayaran }, { status: 201 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Upload bukti transfer / QRIS" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 5 MB" }, { status: 400 });
    }
    const ext = MIME[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Format bukti: JPG, PNG, WEBP, atau PDF" }, { status: 400 });
    }

    const prisma = prismaAwal;

    const dir = path.join(process.cwd(), "public", "uploads", "bukti");
    await mkdir(dir, { recursive: true });
    const filename = `${user.tenantId}-${Date.now()}.${ext}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    const buktiUrl = `/uploads/bukti/${filename}`;

    const pembayaran = await prisma.pembayaranLangganan.create({
      data: {
        tenantId: user.tenantId,
        targetTier,
        periode,
        jumlah: tagihan.bayar,
        jumlahAsli: tagihan.harga,
        jumlahDiskon: tagihan.diskon,
        voucherId: tagihan.voucherId,
        buktiUrl,
        catatan,
      },
    });

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { status: "PENDING_PAYMENT" },
    });

    await catatAudit({
      userId: user.id,
      aksi: "CREATE",
      entitas: "PembayaranLangganan",
      entitasId: pembayaran.id,
      detail: { targetTier, periode, jumlah: tagihan.bayar, voucher: tagihan.kode },
    });

    return NextResponse.json({ pembayaran }, { status: 201 });
  } catch (error) {
    if (error instanceof VoucherError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return apiError(error);
  }
});
