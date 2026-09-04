import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { runWithTenant } from "@/lib/tenant";
import { getRingkasanLangganan } from "@/lib/subscription";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PLATFORM_ADMIN") redirect("/admin");

  const pengaturan = user.tenantId
    ? await runWithTenant(user.tenantId, () =>
        getPrisma().pengaturan.findUnique({ where: { tenantId: user.tenantId! } })
      )
    : null;

  const ringkasan = user.tenantId
    ? await runWithTenant(user.tenantId, () => getRingkasanLangganan(user.tenantId!)).catch(() => null)
    : null;

  return (
    <AppLayout
      nama={user.nama}
      role={user.role}
      namaToko={pengaturan?.namaToko ?? user.tenantNama ?? "Gampangin FNB"}
      tier={user.tier}
      kuota={
        ringkasan
          ? {
              transaksiTerpakai: ringkasan.transaksiTerpakai,
              maxTransaksiBulan: ringkasan.maxTransaksiBulan,
              transaksiSisa: ringkasan.transaksiSisa,
              pendingPembayaran: Boolean(ringkasan.pendingPembayaran),
              sisaHari: ringkasan.sisaHari,
            }
          : null
      }
    >
      {children}
    </AppLayout>
  );
}
