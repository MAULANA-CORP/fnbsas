"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Store } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/pembayaran", label: "Pembayaran" },
  { href: "/admin/tenants", label: "Tenant" },
  { href: "/admin/voucher", label: "Voucher" },
  { href: "/admin/pengaturan", label: "Rekening" },
];

export function AdminShell({ nama, children }: { nama: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Berhasil logout");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-background px-4 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#B42318] p-1.5">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">Admin platform</span>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium",
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden text-sm text-gray-700 dark:text-gray-300 sm:block">{nama}</p>
          <ThemeToggle />
          <button
            onClick={logout}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
