import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-helpers";
import { getPrismaBase } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { runWithTenant } from "@/lib/tenant";
import { getRingkasanLangganan } from "@/lib/subscription";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PLATFORM_ADMIN") redirect("/admin");
  if (!user.tenantId) redirect("/login");

  // Bootstrap layout pakai Prisma base + filter eksplisit.
  // Hindari ketergantungan ALS antar chunk Next standalone di sini.
  const pengaturan = await getPrismaBase().pengaturan.findUnique({
    where: { tenantId: user.tenantId },
  });

  const ringkasan = await runWithTenant(user.tenantId, () =>
    getRingkasanLangganan(user.tenantId!)
  ).catch(() => null);

  return (
    <AppLayout
      nama={user.nama}
      role={user.role}
      namaToko={pengaturan?.namaToko ?? user.tenantNama ?? "Gampangin FNB"}
      logoUrl={pengaturan?.logoUrl ?? null}
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
