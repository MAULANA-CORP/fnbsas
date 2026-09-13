import { NextResponse } from "next/server";
import { withOwnerFinance, apiError, catatAudit } from "@/lib/api-helpers";
import { hitungSaldoKasKumulatif } from "@/lib/finance";
import { getPrisma } from "@/lib/prisma";
import { parseTanggalAkhir } from "@/lib/period";
import { akhirHariIni } from "@/lib/period";

export const GET = withOwnerFinance(async () => {
  try {
    const list = await getPrisma().tutupBuku.findMany({
      orderBy: { tanggal: "desc" },
      take: 50,
      include: { user: { select: { nama: true } } },
    });
    return NextResponse.json({
      data: list.map((t) => ({
        id: t.id,
        tanggal: t.tanggal,
        saldoSistem: Number(t.saldoSistem),
        aktualKas: Number(t.aktualKas),
        selisih: Number(t.selisih),
        catatan: t.catatan,
        namaUser: t.user.nama,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
});

export const POST = withOwnerFinance(async (user, req) => {
  try {
    const body = await req.json();
    const { aktualKas, catatan } = body;

    if (aktualKas === undefined || typeof aktualKas !== "number") {
      return NextResponse.json({ error: "Nilai kas aktual (aktualKas) tidak valid" }, { status: 400 });
    }

    const asOf = body.tanggal ? parseTanggalAkhir(String(body.tanggal)) ?? akhirHariIni() : akhirHariIni();
    const prisma = getPrisma();
    const terakhir = await prisma.tutupBuku.findFirst({ orderBy: { tanggal: "desc" } });
    if (terakhir && asOf.getTime() <= terakhir.tanggal.getTime()) {
      return NextResponse.json(
        { error: "Sudah ada tutup buku pada atau setelah tanggal ini." },
        { status: 400 }
      );
    }

    const saldoSistem = await hitungSaldoKasKumulatif(asOf);
    const selisih = aktualKas - saldoSistem;

    const row = await prisma.tutupBuku.create({
      data: {
        tanggal: asOf,
        saldoSistem,
        aktualKas,
        selisih,
        catatan: typeof catatan === "string" ? catatan.trim() || null : null,
        userId: user.id,
        tenantId: user.tenantId!,
      },
    });

    await catatAudit({
      userId: user.id,
      aksi: "UPDATE",
      entitas: "TutupBuku",
      entitasId: row.id,
      detail: { saldoSistem, aktualKas, selisih, tanggal: asOf.toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: "Tutup buku tercatat. Transaksi sampai tanggal ini tidak bisa diubah.",
      data: { saldoSistem, aktualKas, selisih, tanggal: asOf },
    });
  } catch (error) {
    return apiError(error);
  }
});
