import { NextResponse } from "next/server";
import { withOwner, catatAudit, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { type PaketBerbayar, type PeriodeLangganan } from "@/lib/subscription";
import { buatSnapToken, midtransAktif } from "@/lib/midtrans";
import { aktifkanGratisDenganVoucher, hitungTagihanLangganan } from "@/lib/langganan-bayar";
import { VoucherError } from "@/lib/voucher";

export const POST = withOwner(async (user, req) => {
  try {
    if (!midtransAktif()) {
      return NextResponse.json(
        { error: "Midtrans belum dikonfigurasi. Pakai transfer manual dulu." },
        { status: 503 }
      );
    }
    if (!user.tenantId) {
      return NextResponse.json({ error: "Akun tidak terikat ke toko" }, { status: 400 });
    }

    const body = await req.json();
    const targetTier = String(body?.targetTier ?? "").toUpperCase() as PaketBerbayar;
    const periode = String(body?.periode ?? "").toUpperCase() as PeriodeLangganan;
    const kodeVoucher = String(body?.kodeVoucher ?? "").trim() || null;
    if (targetTier !== "PRO" && targetTier !== "BUSINESS") {
      return NextResponse.json({ error: "Pilih paket PRO atau BUSINESS" }, { status: 400 });
    }
    if (periode !== "BULANAN" && periode !== "TAHUNAN") {
      return NextResponse.json({ error: "Pilih periode bulanan atau tahunan" }, { status: 400 });
    }

    const prisma = getPrisma();
    const pending = await prisma.pembayaranLangganan.findFirst({
      where: { tenantId: user.tenantId, status: "PENDING" },
    });
    if (pending) {
      return NextResponse.json(
        { error: "Masih ada pembayaran yang menunggu. Selesaikan atau tunggu dulu." },
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
      return NextResponse.json({ gratis: true, pembayaran });
    }

    const jumlah = tagihan.bayar;
    const orderId = `SUB-${user.tenantId.slice(0, 8)}-${Date.now()}`;

    const pembayaran = await prisma.pembayaranLangganan.create({
      data: {
        tenantId: user.tenantId,
        targetTier,
        periode,
        jumlah,
        jumlahAsli: tagihan.harga,
        jumlahDiskon: tagihan.diskon,
        voucherId: tagihan.voucherId,
        channel: "MIDTRANS",
        midtransOrderId: orderId,
        catatan: tagihan.kode ? `Snap Midtrans · voucher ${tagihan.kode}` : "Snap Midtrans",
      },
    });

    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
    if (tenant && (tenant.tier === "FREE" || tenant.status === "EXPIRED")) {
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { status: "PENDING_PAYMENT" },
      });
    }

    let snap;
    try {
      snap = await buatSnapToken({
        orderId,
        jumlah,
        nama: user.nama,
        itemNama: `Gampangin ${targetTier} ${periode}`,
      });
    } catch (err) {
      await prisma.pembayaranLangganan.delete({ where: { id: pembayaran.id } });
      throw err;
    }

    await catatAudit({
      userId: user.id,
      aksi: "CREATE",
      entitas: "PembayaranLangganan",
      entitasId: pembayaran.id,
      detail: { channel: "MIDTRANS", targetTier, periode, jumlah, orderId, voucher: tagihan.kode },
    });

    return NextResponse.json({ token: snap.token, redirectUrl: snap.redirectUrl, orderId });
  } catch (error) {
    if (error instanceof VoucherError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return apiError(error);
  }
});
