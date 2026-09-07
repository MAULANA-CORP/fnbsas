"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavActive, navGroupsForRole } from "@/components/layout/nav-items";
import type { Role } from "@/lib/session";

export function Sidebar({
  role,
  className,
  onNavigate,
}: {
  role: Role;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = navGroupsForRole(role);

  return (
    <nav className={cn("flex flex-col gap-5 overflow-y-auto p-3", className)}>
      {groups.map((group) => (
        <div key={group.id}>
          {group.label && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[item.icon] ?? Icons.Circle;
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
