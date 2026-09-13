import { getPrisma } from "@/lib/prisma";

export class PeriodeTerkunciError extends Error {
  constructor(tanggalTutup: Date) {
    super(
      `Periode sampai ${tanggalTutup.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })} sudah ditutup. Data di tanggal itu tidak bisa diubah.`
    );
    this.name = "PeriodeTerkunciError";
  }
}

export async function tutupBukuTerakhir() {
  return getPrisma().tutupBuku.findFirst({
    orderBy: { tanggal: "desc" },
  });
}

/** Tolak mutasi yang tanggalnya sudah masuk periode tutup buku. */
export async function assertPeriodeTerbuka(tanggal: Date = new Date()) {
  const terakhir = await tutupBukuTerakhir();
  if (terakhir && tanggal.getTime() <= terakhir.tanggal.getTime()) {
    throw new PeriodeTerkunciError(terakhir.tanggal);
  }
}
