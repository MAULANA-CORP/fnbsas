import { NextResponse } from "next/server";
import { withPlatformAdmin, catatAudit, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { aktifkanPaket } from "@/lib/subscription";

export const POST = withPlatformAdmin(async (user, req, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const action = String(body?.action ?? "").toUpperCase();
    const reviewNote = typeof body?.note === "string" ? body.note.trim() || null : null;

    if (action !== "APPROVED" && action !== "REJECTED") {
      return NextResponse.json({ error: "action harus APPROVED atau REJECTED" }, { status: 400 });
    }

    const prisma = getPrisma();
    const pembayaran = await prisma.pembayaranLangganan.findUnique({ where: { id } });
    if (!pembayaran) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 });
    }
    if (pembayaran.status !== "PENDING") {
      return NextResponse.json({ error: "Pembayaran ini sudah diproses" }, { status: 400 });
    }
    if (!pembayaran.tenantId) {
      return NextResponse.json({ error: "Pembayaran tidak terikat ke toko" }, { status: 400 });
    }

    if (action === "APPROVED") {
      await aktifkanPaket({
        pembayaranId: id,
        reviewedById: user.id,
        reviewNote,
      });
    } else {
      await prisma.$transaction([
        prisma.pembayaranLangganan.update({
          where: { id },
          data: {
            status: "REJECTED",
            reviewedById: user.id,
            reviewedAt: new Date(),
            reviewNote: reviewNote ?? undefined,
          },
        }),
        prisma.tenant.update({
          where: { id: pembayaran.tenantId },
          data: { status: "ACTIVE" },
        }),
      ]);
    }

    await catatAudit({
      userId: user.id,
      tenantId: pembayaran.tenantId,
      aksi: action === "APPROVED" ? "APPROVE" : "REJECT",
      entitas: "PembayaranLangganan",
      entitasId: id,
      detail: { targetTier: pembayaran.targetTier, note: reviewNote },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
});
