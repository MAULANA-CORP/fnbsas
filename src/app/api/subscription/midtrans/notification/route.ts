import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { catatAudit } from "@/lib/api-helpers";
import { aktifkanPaket } from "@/lib/subscription";
import { notifikasiSah, statusMidtransGagal, statusMidtransLunas } from "@/lib/midtrans";
import { runWithoutTenant } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      order_id?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
      transaction_status?: string;
      fraud_status?: string;
    };

    if (!notifikasiSah(body)) {
      return NextResponse.json({ error: "Signature tidak sah" }, { status: 403 });
    }

    const orderId = body.order_id!;
    const trx = body.transaction_status ?? "";

    return await runWithoutTenant(async () => {
      const prisma = getPrisma();
      const pembayaran = await prisma.pembayaranLangganan.findUnique({
        where: { midtransOrderId: orderId },
      });
      if (!pembayaran) {
        return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
      }

      if (statusMidtransLunas(trx, body.fraud_status)) {
        const hasil = await aktifkanPaket({
          pembayaranId: pembayaran.id,
          reviewNote: `Midtrans ${trx}`,
        });
        if (!hasil.already && pembayaran.tenantId) {
          const admin = await prisma.user.findFirst({
            where: { role: "PLATFORM_ADMIN", isActive: true },
          });
          if (admin) {
            await catatAudit({
              userId: admin.id,
              tenantId: pembayaran.tenantId,
              aksi: "APPROVE",
              entitas: "PembayaranLangganan",
              entitasId: pembayaran.id,
              detail: { channel: "MIDTRANS", orderId, trx },
            });
          }
        }
        return NextResponse.json({ ok: true });
      }

      if (statusMidtransGagal(trx) && pembayaran.status === "PENDING") {
        await prisma.pembayaranLangganan.update({
          where: { id: pembayaran.id },
          data: { status: "REJECTED", reviewNote: `Midtrans ${trx}`, reviewedAt: new Date() },
        });
        if (pembayaran.tenantId) {
          const tenant = await prisma.tenant.findUnique({ where: { id: pembayaran.tenantId } });
          if (tenant?.status === "PENDING_PAYMENT") {
            await prisma.tenant.update({
              where: { id: pembayaran.tenantId },
              data: { status: tenant.tier === "FREE" ? "ACTIVE" : "ACTIVE" },
            });
          }
        }
      }

      return NextResponse.json({ ok: true });
    });
  } catch (error) {
    console.error("[midtrans webhook]", error);
    return NextResponse.json({ error: "Webhook gagal" }, { status: 500 });
  }
}
