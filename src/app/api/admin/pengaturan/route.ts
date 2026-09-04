import { NextResponse } from "next/server";
import { withPlatformAdmin, catatAudit, apiError } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { getRekening } from "@/lib/subscription";

export const GET = withPlatformAdmin(async () => {
  try {
    return NextResponse.json({ rekening: await getRekening() });
  } catch (error) {
    return apiError(error);
  }
});

export const PATCH = withPlatformAdmin(async (user, req) => {
  try {
    const body = await req.json();
    const bankName = String(body?.bank ?? "").trim();
    const bankAccount = String(body?.nomor ?? "").trim();
    const bankHolder = String(body?.atasNama ?? "").trim();
    const qrisUrl = typeof body?.qrisUrl === "string" && body.qrisUrl.trim() ? body.qrisUrl.trim() : null;
    if (!bankName || !bankAccount || !bankHolder) {
      return NextResponse.json({ error: "Bank, nomor, dan atas nama wajib" }, { status: 400 });
    }
    const pengaturan = await getPrisma().pengaturanPlatform.upsert({
      where: { id: "platform" },
      create: { id: "platform", bankName, bankAccount, bankHolder, qrisUrl },
      update: { bankName, bankAccount, bankHolder, qrisUrl },
    });
    await catatAudit({
      userId: user.id,
      aksi: "UPDATE",
      entitas: "PengaturanPlatform",
      entitasId: "platform",
      detail: { bankName, bankAccount, bankHolder },
    });
    return NextResponse.json({
      rekening: {
        bank: pengaturan.bankName,
        nomor: pengaturan.bankAccount,
        atasNama: pengaturan.bankHolder,
        qrisUrl: pengaturan.qrisUrl,
      },
    });
  } catch (error) {
    return apiError(error);
  }
});
