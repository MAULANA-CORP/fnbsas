import { NextResponse } from "next/server";
import { withPlatformAdmin, catatAudit, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { normalisasiKode } from "@/lib/voucher";

export const GET = withPlatformAdmin(async () => {
  try {
    const vouchers = await getPrisma().voucher.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        pakai: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { tenant: { select: { namaUsaha: true, slug: true } } },
        },
      },
    });
    return NextResponse.json({
      vouchers: vouchers.map((v) => ({
        id: v.id,
        kode: v.kode,
        tipe: v.tipe,
        nilai: Number(v.nilai),
        berlakuUntuk: v.berlakuUntuk,
        maxPakai: v.maxPakai,
        dipakai: v.dipakai,
        satuPerToko: v.satuPerToko,
        berlakuSampai: v.berlakuSampai,
        isActive: v.isActive,
        catatan: v.catatan,
        createdAt: v.createdAt,
        pemakai: v.pakai.map((p) => ({
          tenantId: p.tenantId,
          namaUsaha: p.tenant.namaUsaha,
          slug: p.tenant.slug,
          createdAt: p.createdAt,
        })),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
});

export const POST = withPlatformAdmin(async (user, req) => {
  try {
    const body = await req.json();
    const kode = normalisasiKode(String(body?.kode ?? ""));
    const tipe = String(body?.tipe ?? "").toUpperCase();
    const nilai = Number(body?.nilai);
    const berlakuUntuk = String(body?.berlakuUntuk ?? "SEMUA").toUpperCase();
    const maxPakai = body?.maxPakai === "" || body?.maxPakai == null ? null : Number(body.maxPakai);
    const satuPerToko = body?.satuPerToko !== false;
    const berlakuSampai = body?.berlakuSampai ? new Date(body.berlakuSampai) : null;
    const catatan = typeof body?.catatan === "string" ? body.catatan.trim() || null : null;

    if (kode.length < 3) return NextResponse.json({ error: "Kode minimal 3 huruf/angka" }, { status: 400 });
    if (tipe !== "PERSEN" && tipe !== "NOMINAL") {
      return NextResponse.json({ error: "Tipe harus PERSEN atau NOMINAL" }, { status: 400 });
    }
    if (!(nilai > 0)) return NextResponse.json({ error: "Nilai diskon harus lebih dari 0" }, { status: 400 });
    if (tipe === "PERSEN" && nilai > 100) {
      return NextResponse.json({ error: "Diskon persen maksimal 100" }, { status: 400 });
    }
    if (!["SEMUA", "PRO", "BUSINESS"].includes(berlakuUntuk)) {
      return NextResponse.json({ error: "Berlaku untuk tidak valid" }, { status: 400 });
    }
    if (maxPakai != null && !(maxPakai > 0)) {
      return NextResponse.json({ error: "Max pakai harus kosong atau lebih dari 0" }, { status: 400 });
    }

    const prisma = getPrisma();
    const existing = await prisma.voucher.findUnique({ where: { kode } });
    if (existing) return NextResponse.json({ error: "Kode sudah dipakai" }, { status: 400 });

    const voucher = await prisma.voucher.create({
      data: { kode, tipe: tipe as "PERSEN" | "NOMINAL", nilai, berlakuUntuk, maxPakai, satuPerToko, berlakuSampai, catatan },
    });
    await catatAudit({
      userId: user.id,
      aksi: "CREATE",
      entitas: "Voucher",
      entitasId: voucher.id,
      detail: { kode, tipe, nilai },
    });
    return NextResponse.json({ voucher }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
});
