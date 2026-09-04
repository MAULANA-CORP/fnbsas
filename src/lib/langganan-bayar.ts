import { getPrisma } from "@/lib/prisma";
import {
  HARGA_LANGGANAN,
  aktifkanPaket,
  type PaketBerbayar,
  type PeriodeLangganan,
} from "@/lib/subscription";
import { cekVoucher, catatPakaiVoucher } from "@/lib/voucher";

export async function hitungTagihanLangganan(params: {
  targetTier: PaketBerbayar;
  periode: PeriodeLangganan;
  tenantId: string;
  kodeVoucher?: string | null;
}) {
  const harga = HARGA_LANGGANAN[params.targetTier][params.periode];
  const kode = params.kodeVoucher?.trim();
  if (!kode) {
    return { harga, diskon: 0, bayar: harga, voucherId: null as string | null, kode: null as string | null };
  }
  const hasil = await cekVoucher({
    kode,
    targetTier: params.targetTier,
    periode: params.periode,
    tenantId: params.tenantId,
  });
  return {
    harga: hasil.harga,
    diskon: hasil.diskon,
    bayar: hasil.bayar,
    voucherId: hasil.voucher.id,
    kode: hasil.voucher.kode,
  };
}

/** Voucher 100% / potongan penuh: aktifkan paket tanpa transfer. */
export async function aktifkanGratisDenganVoucher(params: {
  userId: string;
  tenantId: string;
  targetTier: PaketBerbayar;
  periode: PeriodeLangganan;
  tagihan: Awaited<ReturnType<typeof hitungTagihanLangganan>>;
}) {
  if (params.tagihan.bayar > 0 || !params.tagihan.voucherId) {
    throw new Error("Tagihan ini masih harus dibayar");
  }
  await catatPakaiVoucher(params.tagihan.voucherId, params.tenantId);
  const prisma = getPrisma();
  const pembayaran = await prisma.pembayaranLangganan.create({
    data: {
      tenantId: params.tenantId,
      targetTier: params.targetTier,
      periode: params.periode,
      jumlah: 0,
      jumlahAsli: params.tagihan.harga,
      jumlahDiskon: params.tagihan.diskon,
      channel: "VOUCHER",
      voucherId: params.tagihan.voucherId,
      catatan: `Voucher ${params.tagihan.kode}`,
    },
  });
  await aktifkanPaket({
    pembayaranId: pembayaran.id,
    reviewedById: params.userId,
    reviewNote: `Gratis via voucher ${params.tagihan.kode}`,
  });
  return pembayaran;
}
