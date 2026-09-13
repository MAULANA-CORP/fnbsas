import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";
import { runWithTenant } from "@/lib/tenant";
import { UtangPiutangClient } from "./_components/utang-piutang-client";

// Halaman Utang & Piutang — 2 tab (Piutang selalu tampil ke OWNER/FINANCE/SALES,
// tab Utang hanya OWNER/FINANCE). Outlet diambil langsung lewat Prisma (read-only,
// bukan lewat API modul lain) supaya halaman ini tidak bergantung modul lain.
export default async function UtangPiutangPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "FINANCE", "SALES"].includes(user.role)) redirect("/dashboard");

  if (!user.tenantId) redirect("/login");

  const outlets = await runWithTenant(user.tenantId, () =>
    getPrisma().outlet.findMany({
      where: { isActive: true },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    })
  );

  return <UtangPiutangClient role={user.role} outlets={outlets} />;
}
