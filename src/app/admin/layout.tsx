import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-helpers";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "PLATFORM_ADMIN") redirect("/dashboard");

  return <AdminShell nama={user.nama}>{children}</AdminShell>;
}
