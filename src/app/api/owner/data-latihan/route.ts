import { NextResponse } from "next/server";
import { withOwner, apiError, catatAudit } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { tenantCreate } from "@/lib/tenant";

/** POST — isi data contoh berlabel LATIHAN- (tidak menghapus data asli). */
export const POST = withOwner(async (user) => {
  try {
    const prisma = getPrisma();
    const outlet = await prisma.outlet.findFirst({ where: { isActive: true } });
    if (!outlet) {
      return NextResponse.json({ error: "Buat outlet dulu sebelum isi data latihan." }, { status: 400 });
    }

    if (!(await prisma.customer.findFirst({ where: { nama: "LATIHAN-Pelanggan Umum" } }))) {
      await prisma.customer.create({
        data: tenantCreate({ nama: "LATIHAN-Pelanggan Umum", kontak: "0800000000" }, user.tenantId),
      });
    }
    if (!(await prisma.bahanBaku.findFirst({ where: { nama: "LATIHAN-Cabai" } }))) {
      await prisma.bahanBaku.create({
        data: tenantCreate({
          nama: "LATIHAN-Cabai",
          satuan: "kg",
          stok: 10,
          stokMinimum: 2,
          hargaRataRata: 35000,
        }, user.tenantId),
      });
    }
    if (!(await prisma.produkJadi.findFirst({ where: { nama: "LATIHAN-Sambal 100gr" } }))) {
      await prisma.produkJadi.create({
        data: tenantCreate({
          nama: "LATIHAN-Sambal 100gr",
          satuan: "pcs",
          beratBersih: 100,
          harga: 15000,
          stok: 20,
          stokMinimum: 5,
        }, user.tenantId),
      });
    }

    await catatAudit({
      userId: user.id,
      aksi: "CREATE",
      entitas: "DataLatihan",
      detail: { outlet: outlet.id },
    });

    return NextResponse.json({
      ok: true,
      message: "Data latihan siap. Cari item berawalan LATIHAN- di Database, lalu coba buat order POS.",
    });
  } catch (error) {
    return apiError(error);
  }
});
