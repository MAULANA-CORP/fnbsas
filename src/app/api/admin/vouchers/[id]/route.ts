import { NextResponse } from "next/server";
import { withPlatformAdmin, catatAudit, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";

export const PATCH = withPlatformAdmin(async (user, req, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const prisma = getPrisma();
    const existing = await prisma.voucher.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 404 });

    const data: {
      isActive?: boolean;
      maxPakai?: number | null;
      berlakuSampai?: Date | null;
      catatan?: string | null;
    } = {};
    if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
    if (body?.maxPakai === "" || body?.maxPakai === null) data.maxPakai = null;
    else if (body?.maxPakai != null) data.maxPakai = Number(body.maxPakai);
    if (body?.berlakuSampai === "" || body?.berlakuSampai === null) data.berlakuSampai = null;
    else if (body?.berlakuSampai) data.berlakuSampai = new Date(body.berlakuSampai);
    if (typeof body?.catatan === "string") data.catatan = body.catatan.trim() || null;

    const voucher = await prisma.voucher.update({ where: { id }, data });
    await catatAudit({
      userId: user.id,
      aksi: "UPDATE",
      entitas: "Voucher",
      entitasId: id,
      detail: data,
    });
    return NextResponse.json({ voucher });
  } catch (error) {
    return apiError(error);
  }
});
