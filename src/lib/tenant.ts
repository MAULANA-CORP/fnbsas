import { AsyncLocalStorage } from "node:async_hooks";

export type TenantContext = {
  tenantId: string | null;
  skip: boolean;
};

export const tenantAls = new AsyncLocalStorage<TenantContext>();

/** Model yang punya kolom tenantId dan wajib di-scope. */
export const TENANTED_MODELS = new Set([
  "User",
  "Outlet",
  "Pengaturan",
  "AuditLog",
  "Customer",
  "Agen",
  "Supplier",
  "BahanBaku",
  "Kemasan",
  "ProdukJadi",
  "OrderPOS",
  "OrderB2B",
  "Invoice",
  "SuratJalan",
  "Piutang",
  "Pembelian",
  "Utang",
  "Pembayaran",
  "Proses",
  "Output",
  "StokMovementBahanBaku",
  "StokMovementKemasan",
  "StokMovementProdukJadi",
  "Modal",
  "Pengeluaran",
  "PembayaranLangganan",
  "VoucherPakai",
  "TutupBuku",
]);

/**
 * Tabel anak tanpa kolom tenantId — di-scope lewat induk.
 * Query langsung (findMany item) tidak boleh lolos lintas toko.
 */
export const CHILD_SCOPED_MODELS: Record<string, (tenantId: string) => Record<string, unknown>> = {
  OrderPOSItem: (tenantId) => ({ orderPOS: { tenantId } }),
  OrderB2BItem: (tenantId) => ({ orderB2B: { tenantId } }),
  PembelianItem: (tenantId) => ({ pembelian: { tenantId } }),
  ProsesBahanBaku: (tenantId) => ({ proses: { tenantId } }),
  OutputProdukJadi: (tenantId) => ({ output: { tenantId } }),
  OutputKemasan: (tenantId) => ({ output: { tenantId } }),
  OutputBiayaLain: (tenantId) => ({ output: { tenantId } }),
  OutputProses: (tenantId) => ({ output: { tenantId } }),
};

export function getTenantContext(): TenantContext | undefined {
  return tenantAls.getStore();
}

/** Jalankan query dalam lingkup satu toko. Jangan dipanggil dengan tenantId kosong. */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  if (!tenantId) {
    throw new Error("runWithTenant butuh tenantId");
  }
  return tenantAls.run({ tenantId, skip: false }, fn);
}

/** Login, register, seed, admin platform, webhook Midtrans. */
export function runWithoutTenant<T>(fn: () => T): T {
  return tenantAls.run({ tenantId: null, skip: true }, fn);
}

/** Gabungkan filter tenant ke where Prisma — dipakai extension dan tes isolasi. */
export function injectWhere(where: unknown, tenantId: string) {
  if (!where || (typeof where === "object" && Object.keys(where as object).length === 0)) {
    return { tenantId };
  }
  return { AND: [where, { tenantId }] };
}

/** Filter lewat relasi induk (tabel anak tanpa kolom tenantId). */
export function injectRelationWhere(where: unknown, relationFilter: Record<string, unknown>) {
  if (!where || (typeof where === "object" && Object.keys(where as object).length === 0)) {
    return relationFilter;
  }
  return { AND: [where, relationFilter] };
}

/** Sisipkan tenantId ke payload create. Aman dipakai di dalam $transaction. */
export function tenantCreate<T extends object>(data: T, tenantId?: string | null): T & { tenantId?: string } {
  const id = tenantId || getTenantContext()?.tenantId || undefined;
  if (!id) return data as T & { tenantId?: string };
  if ("tenantId" in data && (data as { tenantId?: string }).tenantId) {
    return data as T & { tenantId?: string };
  }
  return { ...data, tenantId: id };
}

export function slugifyNamaUsaha(nama: string): string {
  const base =
    nama
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "toko";
  const suf = Math.random().toString(36).slice(2, 6);
  return `${base}-${suf}`;
}
