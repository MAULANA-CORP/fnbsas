import { NextResponse } from "next/server";
import { withPlatformAdmin, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";

export const GET = withPlatformAdmin(async (_user, req) => {
  try {
    const status = new URL(req.url).searchParams.get("status") ?? "PENDING";
    const where =
      status === "ALL"
        ? {}
        : { status: status as "PENDING" | "APPROVED" | "REJECTED" };

    const list = await getPrisma().pembayaranLangganan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        tenant: { select: { id: true, namaUsaha: true, slug: true, tier: true } },
      },
    });

    return NextResponse.json({
      pembayaran: list.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        namaUsaha: p.tenant?.namaUsaha ?? "-",
        slug: p.tenant?.slug ?? "",
        tierSekarang: p.tenant?.tier ?? "FREE",
        targetTier: p.targetTier,
        periode: p.periode,
        jumlah: Number(p.jumlah),
        buktiUrl: p.buktiUrl,
        catatan: p.catatan,
        status: p.status,
        reviewNote: p.reviewNote,
        reviewedAt: p.reviewedAt,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
});
