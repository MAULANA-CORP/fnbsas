import { NextResponse } from "next/server";
import { withPlatformAdmin, catatAudit, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { hitungPerpanjangan, type PaketBerbayar, type PeriodeLangganan } from "@/lib/subscription";

export const PATCH = withPlatformAdmin(async (user, req, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const prisma = getPrisma();
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });

    if (body?.action === "set-paket") {
      const tier = String(body.tier ?? "").toUpperCase();
      if (tier === "FREE") {
        const updated = await prisma.tenant.update({
          where: { id },
          data: { tier: "FREE", periode: null, paidUntil: null, status: "ACTIVE" },
        });
        await catatAudit({
          userId: user.id,
          tenantId: id,
          aksi: "UPDATE",
          entitas: "Tenant",
          entitasId: id,
          detail: { action: "set-paket", tier: "FREE" },
        });
        return NextResponse.json({ tenant: updated });
      }
      if (tier !== "PRO" && tier !== "BUSINESS") {
        return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });
      }
      const periode = String(body.periode ?? "BULANAN").toUpperCase() as PeriodeLangganan;
      if (periode !== "BULANAN" && periode !== "TAHUNAN") {
        return NextResponse.json({ error: "Periode tidak valid" }, { status: 400 });
      }
      const paidUntil = hitungPerpanjangan(periode, tenant.paidUntil);
      const updated = await prisma.tenant.update({
        where: { id },
        data: { tier: tier as PaketBerbayar, periode, paidUntil, status: "ACTIVE", isSuspended: false },
      });
      await prisma.pembayaranLangganan.create({
        data: {
          tenantId: id,
          targetTier: tier as PaketBerbayar,
          periode,
          jumlah: 0,
          jumlahAsli: 0,
          channel: "MANUAL",
          status: "APPROVED",
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNote: "Set paket manual oleh admin",
          catatan: "Set paket manual oleh admin",
        },
      });
      await catatAudit({
        userId: user.id,
        tenantId: id,
        aksi: "UPDATE",
        entitas: "Tenant",
        entitasId: id,
        detail: { action: "set-paket", tier, periode, paidUntil },
      });
      return NextResponse.json({ tenant: updated });
    }

    if (body?.action === "suspend") {
      const updated = await prisma.tenant.update({
        where: { id },
        data: { isSuspended: Boolean(body.isSuspended) },
      });
      await catatAudit({
        userId: user.id,
        tenantId: id,
        aksi: "UPDATE",
        entitas: "Tenant",
        entitasId: id,
        detail: { action: "suspend", isSuspended: updated.isSuspended },
      });
      return NextResponse.json({ tenant: updated });
    }

    if (body?.action === "catatan") {
      const updated = await prisma.tenant.update({
        where: { id },
        data: { catatanInternal: String(body.catatanInternal ?? "").trim() || null },
      });
      return NextResponse.json({ tenant: updated });
    }

    return NextResponse.json({ error: "action tidak dikenali" }, { status: 400 });
  } catch (error) {
    return apiError(error);
  }
});
