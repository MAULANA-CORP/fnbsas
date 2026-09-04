"use client";

import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingSkeleton } from "@/components/ui/empty-state";
import { formatRupiah, formatTanggalJam } from "@/lib/utils";
import { Textarea } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface Row {
  id: string;
  namaUsaha: string;
  slug: string;
  tierSekarang: string;
  targetTier: string;
  periode: string;
  jumlah: number;
  buktiUrl: string;
  catatan: string | null;
  status: string;
  createdAt: string;
}

export default function AdminPembayaranPage() {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [note, setNote] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState("PENDING");

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/admin/pembayaran?status=${status}`);
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Gagal memuat");
      return;
    }
    setRows(json.pembayaran);
  }, [status]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function review(id: string, action: "APPROVED" | "REJECTED") {
    setBusy(id + action);
    try {
      const res = await fetch(`/api/admin/pembayaran/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note[id] ?? "" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal memproses");
        return;
      }
      toast.success(action === "APPROVED" ? "Paket diaktifkan" : "Pembayaran ditolak");
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (!rows) return <LoadingSkeleton />;

  return (
    <div>
      <PageHeader title="Pembayaran langganan" description="Cek bukti transfer, lalu aktifkan PRO atau BUSINESS." />
      <div className="mb-4 max-w-xs">
        <SearchableSelect
          label="Status"
          value={status}
          onChange={(v) => setStatus(v ?? "PENDING")}
          options={[
            { value: "PENDING", label: "Menunggu" },
            { value: "APPROVED", label: "Diaktifkan" },
            { value: "REJECTED", label: "Ditolak" },
            { value: "ALL", label: "Semua" },
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Tidak ada yang menunggu" description="Semua pembayaran sudah diproses." />
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.id} className="grid gap-4 md:grid-cols-[1fr_160px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{r.namaUsaha}</p>
                  <Badge tone="gray">{r.tierSekarang}</Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">→ {r.targetTier}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {r.periode.toLowerCase()} · {formatRupiah(r.jumlah)} · {formatTanggalJam(r.createdAt)}
                </p>
                {r.catatan && <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Catatan: {r.catatan}</p>}
                <a
                  href={r.buktiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-blue-700 dark:text-blue-400"
                >
                  Buka bukti
                </a>
                <div className="mt-3 max-w-md">
                  <Textarea
                    label="Catatan review"
                    rows={2}
                    value={note[r.id] ?? ""}
                    onChange={(e) => setNote((s) => ({ ...s, [r.id]: e.target.value }))}
                  />
                </div>
                {r.status === "PENDING" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" loading={busy === r.id + "APPROVED"} onClick={() => review(r.id, "APPROVED")}>
                    Aktifkan
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={busy === r.id + "REJECTED"}
                    onClick={() => review(r.id, "REJECTED")}
                  >
                    Tolak
                  </Button>
                </div>
                )}
                {r.status !== "PENDING" && (
                  <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">Status: {r.status}</p>
                )}
              </div>
              <a href={r.buktiUrl} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.buktiUrl}
                  alt="Bukti"
                  className="h-40 w-full rounded-lg border object-cover dark:border-zinc-700"
                />
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
