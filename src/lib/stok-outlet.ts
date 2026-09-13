import { getPrisma } from "@/lib/prisma";

export async function petaStokOutlet(
  jenis: "produkJadi" | "bahanBaku" | "kemasan",
  outletId: string
): Promise<Map<string, number>> {
  const prisma = getPrisma();
  const map = new Map<string, number>();

  if (jenis === "produkJadi") {
    const rows = await prisma.stokMovementProdukJadi.groupBy({
      by: ["produkJadiId", "tipe"],
      where: { outletId },
      _sum: { qty: true },
    });
    for (const r of rows) {
      const cur = map.get(r.produkJadiId) ?? 0;
      const qty = Number(r._sum.qty ?? 0);
      map.set(r.produkJadiId, r.tipe === "IN" ? cur + qty : cur - qty);
    }
    return map;
  }
  if (jenis === "bahanBaku") {
    const rows = await prisma.stokMovementBahanBaku.groupBy({
      by: ["bahanBakuId", "tipe"],
      where: { outletId },
      _sum: { qty: true },
    });
    for (const r of rows) {
      const cur = map.get(r.bahanBakuId) ?? 0;
      const qty = Number(r._sum.qty ?? 0);
      map.set(r.bahanBakuId, r.tipe === "IN" ? cur + qty : cur - qty);
    }
    return map;
  }
  const rows = await prisma.stokMovementKemasan.groupBy({
    by: ["kemasanId", "tipe"],
    where: { outletId },
    _sum: { qty: true },
  });
  for (const r of rows) {
    const cur = map.get(r.kemasanId) ?? 0;
    const qty = Number(r._sum.qty ?? 0);
    map.set(r.kemasanId, r.tipe === "IN" ? cur + qty : cur - qty);
  }
  return map;
}
