import { NextResponse } from "next/server";
import { withOwner, apiError } from "@/lib/api-helpers";
import { cekVoucher, VoucherError } from "@/lib/voucher";
import type { PaketBerbayar, PeriodeLangganan } from "@/lib/subscription";

export const POST = withOwner(async (user, req) => {
  try {
    if (!user.tenantId) {
      return NextResponse.json({ error: "Akun tidak terikat ke toko" }, { status: 400 });
    }
    const body = await req.json();
    const targetTier = String(body?.targetTier ?? "").toUpperCase() as PaketBerbayar;
    const periode = String(body?.periode ?? "").toUpperCase() as PeriodeLangganan;
    const kode = String(body?.kode ?? "");
    if (targetTier !== "PRO" && targetTier !== "BUSINESS") {
      return NextResponse.json({ error: "Pilih paket dulu" }, { status: 400 });
    }
    if (periode !== "BULANAN" && periode !== "TAHUNAN") {
      return NextResponse.json({ error: "Pilih periode dulu" }, { status: 400 });
    }
    const hasil = await cekVoucher({ kode, targetTier, periode, tenantId: user.tenantId });
    return NextResponse.json(hasil);
  } catch (error) {
    if (error instanceof VoucherError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return apiError(error);
  }
});
