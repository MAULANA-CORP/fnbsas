"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { bottomNavForRole, isNavActive } from "@/components/layout/nav-items";
import type { Role } from "@/lib/session";

export function BottomNav({
  role,
  onOpenMenu,
}: {
  role: Role;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const items = bottomNavForRole(role);
  if (items.length === 0) return null;

  const menuActive = !items.some((i) => isNavActive(pathname, i.href));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-900/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigasi utama"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[item.icon] ?? Icons.Circle;
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
                active
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
              <span className="truncate">{item.shortLabel ?? item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMenu}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
            menuActive ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400"
          )}
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </div>
    </nav>
  );
}
