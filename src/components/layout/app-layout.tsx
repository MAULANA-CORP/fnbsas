"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { X, LogOut, Store } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Role, SubscriptionTier } from "@/lib/session";

const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  FINANCE: "Finance",
  SALES: "Sales",
  PRODUKSI: "Produksi",
  PLATFORM_ADMIN: "Platform",
};

const TIER_TONE: Record<SubscriptionTier, string> = {
  FREE: "bg-gray-100 text-gray-800 dark:bg-zinc-700 dark:text-gray-200",
  PRO: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300",
  BUSINESS: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300",
};

export function AppLayout({
  nama,
  role,
  namaToko,
  tier,
  kuota,
  children,
}: {
  nama: string;
  role: Role;
  namaToko: string;
  tier?: SubscriptionTier | null;
  kuota?: {
    transaksiTerpakai: number;
    maxTransaksiBulan: number | null;
    transaksiSisa: number | null;
    pendingPembayaran: boolean;
    sisaHari: number | null;
  } | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Berhasil logout");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 dark:border-zinc-800 lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4 dark:border-zinc-800">
          <div className="rounded-lg bg-blue-600 p-1.5 dark:bg-blue-500">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{namaToko}</span>
          {tier && (
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIER_TONE[tier]}`}>
              {tier}
            </span>
          )}
        </div>
        <Sidebar role={role} className="flex-1" />
        <div className="border-t border-gray-200 px-4 py-3 dark:border-zinc-800">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{nama}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{ROLE_LABEL[role]}</p>
        </div>
      </aside>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside
            className="absolute left-0 top-0 flex h-full w-[min(20rem,88vw)] flex-col bg-background shadow-xl"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex h-14 items-center justify-between gap-2 border-b border-gray-200 px-4 dark:border-zinc-800">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{namaToko}</p>
                {tier && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIER_TONE[tier]}`}>{tier}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar role={role} className="flex-1" onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-gray-200 px-4 py-3 dark:border-zinc-800" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{nama}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{ROLE_LABEL[role]}</p>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-gray-200 bg-background/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur dark:border-zinc-800 sm:px-4">
          <div className="min-w-0 lg:hidden">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{namaToko}</p>
            <p className="truncate text-xs text-gray-600 dark:text-gray-400">
              {nama} · {ROLE_LABEL[role]}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <div className="hidden text-right lg:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{nama}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{ROLE_LABEL[role]}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6">
          {kuota?.sisaHari != null && kuota.sisaHari >= 0 && kuota.sisaHari <= 7 && role === "OWNER" && !kuota.pendingPembayaran && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Paket habis dalam {kuota.sisaHari} hari.{" "}
              <Link href="/langganan" className="font-semibold underline">
                Perpanjang
              </Link>
            </div>
          )}
          {kuota?.pendingPembayaran && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Bukti transfer sedang dicek. Paket belum berubah sampai admin mengaktifkan.{" "}
              <Link href="/langganan" className="font-semibold underline">
                Lihat Langganan
              </Link>
            </div>
          )}
          {kuota && kuota.maxTransaksiBulan != null && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                kuota.transaksiSisa === 0
                  ? "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
                  : (kuota.transaksiSisa ?? 99) <= 10
                    ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                    : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
              }`}
            >
              Paket FREE · {kuota.transaksiTerpakai}/{kuota.maxTransaksiBulan} transaksi bulan ini
              {kuota.transaksiSisa === 0
                ? " — kuota habis, transaksi baru ditolak."
                : `. Sisa ${kuota.transaksiSisa}.`}{" "}
              {role === "OWNER" && (
                <Link href="/langganan" className="font-semibold underline">
                  Upgrade
                </Link>
              )}
            </div>
          )}
          {children}
        </main>
      </div>

      <BottomNav role={role} onOpenMenu={() => setDrawerOpen(true)} />
    </div>
  );
}
