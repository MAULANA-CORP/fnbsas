"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <RadixDialog.Content
          className={cn(
            "fixed z-50 overflow-y-auto border p-5 shadow-lg",
            "border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800",
            "inset-x-0 bottom-0 max-h-[92dvh] w-full rounded-t-2xl",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl",
            className
          )}
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <RadixDialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-700">
              <X className="h-4 w-4" />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Dialog konfirmasi hapus/aksi berbahaya — jangan pernah hapus langsung tanpa ini. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  danger,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-50 dark:hover:bg-zinc-700"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={cn(
            "min-h-11 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-60",
            danger ? "bg-red-600 hover:bg-red-700 dark:bg-red-500" : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500"
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
