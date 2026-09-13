import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-helpers";
import { LaporanPengeluaranClient } from "./laporan-pengeluaran-client";

export default async function LaporanPengeluaranPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["OWNER", "FINANCE"].includes(user.role)) redirect("/dashboard");
  return <LaporanPengeluaranClient />;
}
