import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api-helpers";
import { getRingkasanLangganan, HARGA_LANGGANAN, getRekening } from "@/lib/subscription";
import { midtransAktif, midtransClientKey, midtransSnapScriptUrl } from "@/lib/midtrans";

export const GET = withAuth(async (user) => {
  try {
    if (user.role === "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Platform admin tidak punya langganan toko" }, { status: 400 });
    }
    if (!user.tenantId) {
      return NextResponse.json({ error: "Akun tidak terikat ke toko" }, { status: 400 });
    }
    const ringkasan = await getRingkasanLangganan(user.tenantId);
    return NextResponse.json({
      ...ringkasan,
      harga: HARGA_LANGGANAN,
      rekening: await getRekening(),
      midtrans: midtransAktif()
        ? { enabled: true, clientKey: midtransClientKey(), snapUrl: midtransSnapScriptUrl() }
        : { enabled: false, clientKey: "", snapUrl: "" },
    });
  } catch (error) {
    return apiError(error);
  }
});
