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
]);

export function getTenantContext(): TenantContext | undefined {
  return tenantAls.getStore();
}

export function runWithTenant<T>(tenantId: string | null, fn: () => T): T {
  return tenantAls.run({ tenantId, skip: !tenantId }, fn);
}

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
