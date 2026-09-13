import { tenantCreate } from "@/lib/tenant";

type StokTx = {
  // Prisma client / $transaction client — cukup punya method create movement.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stokMovementBahanBaku: { create: (args: { data: any }) => Promise<unknown> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stokMovementKemasan: { create: (args: { data: any }) => Promise<unknown> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stokMovementProdukJadi: { create: (args: { data: any }) => Promise<unknown> };
};

export type JenisStokMaster = "bahanBaku" | "kemasan" | "produkJadi";

/** Catat movement IN/OUT saat stok master diubah manual (Database / import). */
export async function catatPerubahanStokMaster(
  tx: StokTx,
  params: {
    jenis: JenisStokMaster;
    id: string;
    stokLama: number;
    stokBaru: number;
    tenantId?: string | null;
    keterangan: string;
  }
) {
  const delta = Number(params.stokBaru) - Number(params.stokLama);
  if (!Number.isFinite(delta) || delta === 0) return;

  const tipe = delta > 0 ? "IN" : "OUT";
  const qty = Math.abs(delta);
  const data = tenantCreate(
    {
      tipe,
      qty,
      sumber: "ADJUSTMENT" as const,
      keterangan: params.keterangan,
    },
    params.tenantId
  );

  if (params.jenis === "bahanBaku") {
    await tx.stokMovementBahanBaku.create({
      data: { ...data, bahanBakuId: params.id },
    });
    return;
  }
  if (params.jenis === "kemasan") {
    await tx.stokMovementKemasan.create({
      data: { ...data, kemasanId: params.id },
    });
    return;
  }
  await tx.stokMovementProdukJadi.create({
    data: { ...data, produkJadiId: params.id },
  });
}
