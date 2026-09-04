import { getPrisma } from "@/lib/prisma";
import { HARGA_LANGGANAN, type PaketBerbayar, type PeriodeLangganan } from "@/lib/subscription";

export class VoucherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoucherError";
  }
}

export function normalisasiKode(kode: string) {
  return kode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hitungDiskonVoucher(params: {
  harga: number;
  tipe: "PERSEN" | "NOMINAL";
  nilai: number;
}) {
  const harga = Math.max(0, Math.round(params.harga));
  const nilai = Number(params.nilai);
  let diskon = 0;
  if (params.tipe === "PERSEN") {
    const persen = Math.min(100, Math.max(0, nilai));
    diskon = Math.round((harga * persen) / 100);
  } else {
    diskon = Math.round(Math.max(0, nilai));
  }
  diskon = Math.min(diskon, harga);
  return { harga, diskon, bayar: harga - diskon };
}

export async function cekVoucher(params: {
  kode: string;
  targetTier: PaketBerbayar;
  periode: PeriodeLangganan;
  tenantId: string;
}) {
  const kode = normalisasiKode(params.kode);
  if (kode.length < 3) throw new VoucherError("Kode voucher minimal 3 karakter");

  const prisma = getPrisma();
  const voucher = await prisma.voucher.findUnique({ where: { kode } });
  if (!voucher || !voucher.isActive) throw new VoucherError("Kode voucher tidak valid");
  if (voucher.berlakuSampai && voucher.berlakuSampai < new Date()) {
    throw new VoucherError("Voucher sudah kedaluwarsa");
  }
  if (voucher.maxPakai != null && voucher.dipakai >= voucher.maxPakai) {
    throw new VoucherError("Kuota voucher sudah habis");
  }
  if (voucher.berlakuUntuk !== "SEMUA" && voucher.berlakuUntuk !== params.targetTier) {
    throw new VoucherError(`Voucher ini hanya untuk paket ${voucher.berlakuUntuk}`);
  }
  if (voucher.satuPerToko) {
    const sudah = await prisma.voucherPakai.findUnique({
      where: { voucherId_tenantId: { voucherId: voucher.id, tenantId: params.tenantId } },
    });
    if (sudah) throw new VoucherError("Toko ini sudah memakai voucher ini");
  }

  const harga = HARGA_LANGGANAN[params.targetTier][params.periode];
  const hitung = hitungDiskonVoucher({
    harga,
    tipe: voucher.tipe,
    nilai: Number(voucher.nilai),
  });

  return {
    voucher: {
      id: voucher.id,
      kode: voucher.kode,
      tipe: voucher.tipe as "PERSEN" | "NOMINAL",
      nilai: Number(voucher.nilai),
    },
    ...hitung,
  };
}

export async function catatPakaiVoucher(voucherId: string, tenantId: string) {
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const v = await tx.voucher.findUnique({ where: { id: voucherId } });
    if (!v || !v.isActive) throw new VoucherError("Voucher tidak valid");
    if (v.maxPakai != null && v.dipakai >= v.maxPakai) throw new VoucherError("Kuota voucher sudah habis");
    try {
      await tx.voucherPakai.create({ data: { voucherId, tenantId } });
    } catch {
      throw new VoucherError("Toko ini sudah memakai voucher ini");
    }
    await tx.voucher.update({ where: { id: voucherId }, data: { dipakai: { increment: 1 } } });
  });
}
