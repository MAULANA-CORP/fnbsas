"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DataCard({
  title,
  subtitle,
  meta,
  amount,
  badge,
  href,
  onClick,
  icon: Icon,
  tone = "default",
  trailing,
}: {
  title: string;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  amount?: React.ReactNode;
  badge?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: React.ElementType;
  tone?: "default" | "danger" | "warning";
  trailing?: React.ReactNode;
}) {
  const toneClass = {
    default: "border-gray-200 dark:border-zinc-700",
    warning: "border-l-4 border-l-amber-500 border-gray-200 dark:border-zinc-700",
    danger: "border-l-4 border-l-red-600 border-gray-200 bg-red-50/50 dark:border-zinc-700 dark:bg-red-950/20",
  }[tone];

  const inner = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 rounded-lg bg-gray-100 p-2 dark:bg-zinc-700">
            <Icon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-gray-900 dark:text-gray-50">{title}</span>
            {badge}
          </div>
          {subtitle && (
            <div className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-400">{subtitle}</div>
          )}
          {meta && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">{meta}</div>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {amount && (
          <span className="text-right text-sm font-semibold text-gray-900 dark:text-gray-50">{amount}</span>
        )}
        {trailing}
        {(href || onClick) && <ChevronRight className="h-4 w-4 text-gray-400" />}
      </div>
    </>
  );

  const className = cn(
    "flex w-full min-h-14 items-center justify-between gap-3 rounded-xl border bg-white p-4 text-left transition-colors",
    "hover:bg-gray-50 active:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-700",
    toneClass
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
