import { getPrisma } from "@/lib/prisma";
import { tanggalWIB } from "@/lib/utils";
import type { AuthUser } from "@/lib/api-helpers";
import type { SubscriptionTier } from "@/generated/prisma/client";

export class SubscriptionError extends Error {
  status: number;
  constructor(message: string, status = 402) {
    super(message);
    this.name = "SubscriptionError";
    this.status = status;
  }
}

export const TIER_LIMIT = {
  FREE: { maxOutlet: 1, maxTransaksiBulan: 50, label: "FREE" },
  PRO: { maxOutlet: 1, maxTransaksiBulan: Infinity, label: "PRO" },
  BUSINESS: { maxOutlet: 3, maxTransaksiBulan: Infinity, label: "BUSINESS" },
} as const;

export const HARGA_LANGGANAN = {
  PRO: { BULANAN: 99_000, TAHUNAN: 990_000 },
  BUSINESS: { BULANAN: 249_000, TAHUNAN: 2_490_000 },
} as const;

export type PaketBerbayar = "PRO" | "BUSINESS";
export type PeriodeLangganan = "BULANAN" | "TAHUNAN";

export function infoRekening() {
  return {
    bank: process.env.SAAS_BANK_NAME || "BCA",
    nomor: process.env.SAAS_BANK_ACCOUNT || "1234567890",
    atasNama: process.env.SAAS_BANK_HOLDER || "Gampangin FNB",
    qrisUrl: process.env.SAAS_QRIS_IMAGE_URL || "",
  };
}

export async function getRekening() {
  try {
    const p = await getPrisma().pengaturanPlatform.findUnique({ where: { id: "platform" } });
    if (p) {
      return {
        bank: p.bankName || infoRekening().bank,
        nomor: p.bankAccount || infoRekening().nomor,
        atasNama: p.bankHolder || infoRekening().atasNama,
        qrisUrl: p.qrisUrl || infoRekening().qrisUrl,
      };
    }
  } catch {
    /* tabel belum ada */
  }
  return infoRekening();
}

export function awalBulanWIB(date = new Date()): Date {
  const [y, m] = tanggalWIB(date).split("-").map(Number);
  return new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00+07:00`);
}

export function awalBulanBerikutnyaWIB(date = new Date()): Date {
  const [y, m] = tanggalWIB(date).split("-").map(Number);
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  return new Date(`${nextY}-${String(nextM).padStart(2, "0")}-01T00:00:00+07:00`);
}

/** Hitung transaksi operasional bulan ini (WIB). */
/** Kuota transaksi: max null = unlimited (PRO/BUSINESS). */
export function evaluasiKuota(terpakai: number, maxTransaksiBulan: number | null) {
  if (maxTransaksiBulan == null) return { boleh: true, sisa: null as number | null };
  return {
    boleh: terpakai < maxTransaksiBulan,
    sisa: Math.max(0, maxTransaksiBulan - terpakai),
  };
}

export function pesanLimitTransaksi(max: number) {
  return `Paket FREE sudah mencapai ${max} transaksi bulan ini. Upgrade ke PRO untuk transaksi tanpa batas.`;
}

export async function hitungTransaksiBulanIni(tenantId: string): Promise<number> {
  const prisma = getPrisma();
  const start = awalBulanWIB();
  const end = awalBulanBerikutnyaWIB();
  const where = { tenantId, createdAt: { gte: start, lt: end } };

  const [pos, b2b, proses, output, pembelian, pengeluaran] = await Promise.all([
    prisma.orderPOS.count({ where }),
    prisma.orderB2B.count({ where }),
    prisma.proses.count({ where }),
    prisma.output.count({ where }),
    prisma.pembelian.count({ where }),
    prisma.pengeluaran.count({ where }),
  ]);

  return pos + b2b + proses + output + pembelian + pengeluaran;
}

export async function getRingkasanLangganan(tenantId: string) {
  const prisma = getPrisma();
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new SubscriptionError("Tenant tidak ditemukan", 404);

  let tier = tenant.tier as SubscriptionTier;
  let status = tenant.status;
  if (tier !== "FREE" && tenant.paidUntil && tenant.paidUntil < new Date()) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { tier: "FREE", status: "EXPIRED" },
    });
    tier = "FREE";
    status = "EXPIRED";
  }

  const limit = TIER_LIMIT[tier];
  const terpakai = await hitungTransaksiBulanIni(tenantId);
  const pending = await prisma.pembayaranLangganan.findFirst({
    where: { tenantId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return {
    tenantId,
    namaUsaha: tenant.namaUsaha,
    slug: tenant.slug,
    tier,
    status,
    periode: tenant.periode,
    paidUntil: tenant.paidUntil,
    maxOutlet: limit.maxOutlet,
    maxTransaksiBulan: Number.isFinite(limit.maxTransaksiBulan) ? limit.maxTransaksiBulan : null,
    transaksiTerpakai: terpakai,
    transaksiSisa:
      Number.isFinite(limit.maxTransaksiBulan) ? Math.max(0, limit.maxTransaksiBulan - terpakai) : null,
    sisaHari: sisaHariPaket(tenant.paidUntil),
    pendingPembayaran: pending
      ? {
          id: pending.id,
          targetTier: pending.targetTier,
          periode: pending.periode,
          jumlah: Number(pending.jumlah),
          channel: pending.channel,
          buktiUrl: pending.buktiUrl,
          createdAt: pending.createdAt,
        }
      : null,
  };
}

export async function assertBisaTransaksi(user: AuthUser) {
  if (!user.tenantId) throw new SubscriptionError("Akun ini tidak terikat ke toko mana pun", 403);
  const ringkasan = await getRingkasanLangganan(user.tenantId);
  const kuota = evaluasiKuota(ringkasan.transaksiTerpakai, ringkasan.maxTransaksiBulan);
  if (!kuota.boleh) {
    throw new SubscriptionError(pesanLimitTransaksi(ringkasan.maxTransaksiBulan ?? 50));
  }
  return ringkasan;
}

export async function assertBisaTambahOutlet(user: AuthUser) {
  if (!user.tenantId) throw new SubscriptionError("Akun ini tidak terikat ke toko mana pun", 403);
  const ringkasan = await getRingkasanLangganan(user.tenantId);
  const jumlah = await getPrisma().outlet.count({
    where: { isActive: true, tenantId: user.tenantId },
  });
  if (jumlah >= ringkasan.maxOutlet) {
    const next = ringkasan.tier === "BUSINESS" ? "maksimal 3 outlet di paket BUSINESS" : "Upgrade ke BUSINESS untuk sampai 3 outlet";
    throw new SubscriptionError(
      `Paket ${ringkasan.tier} hanya boleh ${ringkasan.maxOutlet} outlet. ${next}.`
    );
  }
  return ringkasan;
}

export function hitungPaidUntil(periode: PeriodeLangganan, from = new Date()): Date {
  const d = new Date(from);
  if (periode === "TAHUNAN") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/** Perpanjang dari sisa masa aktif (kalau masih berlaku), else dari sekarang. */
export function hitungPerpanjangan(
  periode: PeriodeLangganan,
  paidUntil: Date | null | undefined,
  now = new Date()
): Date {
  const base = paidUntil && paidUntil.getTime() > now.getTime() ? paidUntil : now;
  return hitungPaidUntil(periode, base);
}

export function sisaHariPaket(paidUntil: Date | null | undefined, now = new Date()): number | null {
  if (!paidUntil) return null;
  return Math.ceil((paidUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export async function aktifkanPaket(params: {
  pembayaranId: string;
  reviewedById?: string | null;
  reviewNote?: string | null;
}) {
  const prisma = getPrisma();
  const pembayaran = await prisma.pembayaranLangganan.findUnique({
    where: { id: params.pembayaranId },
    include: { tenant: true },
  });
  if (!pembayaran) throw new SubscriptionError("Pembayaran tidak ditemukan", 404);
  if (!pembayaran.tenantId || !pembayaran.tenant) {
    throw new SubscriptionError("Pembayaran tidak terikat ke toko", 400);
  }
  if (pembayaran.status === "APPROVED") {
    return { already: true as const, paidUntil: pembayaran.tenant.paidUntil };
  }
  if (pembayaran.status !== "PENDING") {
    throw new SubscriptionError("Pembayaran ini sudah diproses", 400);
  }

  if (pembayaran.voucherId && pembayaran.tenantId) {
    const { catatPakaiVoucher } = await import("@/lib/voucher");
    const sudah = await prisma.voucherPakai.findUnique({
      where: { voucherId_tenantId: { voucherId: pembayaran.voucherId, tenantId: pembayaran.tenantId } },
    });
    if (!sudah) await catatPakaiVoucher(pembayaran.voucherId, pembayaran.tenantId);
  }

  const paidUntil = hitungPerpanjangan(
    pembayaran.periode as PeriodeLangganan,
    pembayaran.tenant.paidUntil
  );

  await prisma.$transaction([
    prisma.pembayaranLangganan.update({
      where: { id: pembayaran.id },
      data: {
        status: "APPROVED",
        reviewedById: params.reviewedById ?? undefined,
        reviewedAt: new Date(),
        reviewNote: params.reviewNote ?? undefined,
      },
    }),
    prisma.tenant.update({
      where: { id: pembayaran.tenantId },
      data: {
        tier: pembayaran.targetTier,
        periode: pembayaran.periode,
        status: "ACTIVE",
        paidUntil,
      },
    }),
  ]);

  return { already: false as const, paidUntil };
}
