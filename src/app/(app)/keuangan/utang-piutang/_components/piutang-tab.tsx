"use client";

import * as React from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/badge";
import { DataCard } from "@/components/ui/data-card";
import { LoadingSkeleton, EmptyState } from "@/components/ui/empty-state";
import { formatRupiah, formatTanggal, hariOverdue } from "@/lib/utils";
import { FilterBar } from "./filter-bar";
import { PembayaranDialog } from "./pembayaran-dialog";
import { FILTER_KOSONG, filterKeQuery } from "./types";
import type { FilterState, OutletOption, PiutangRow } from "./types";

export function PiutangTab({
  outlets,
  canBayar,
}: {
  outlets: OutletOption[];
  canBayar: boolean;
}) {
  const [filter, setFilter] = React.useState<FilterState>(FILTER_KOSONG);
  const [rows, setRows] = React.useState<PiutangRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedNama, setSelectedNama] = React.useState<string | undefined>(undefined);

  const muat = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = filterKeQuery(filter);
      const res = await fetch(`/api/piutang${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal memuat data piutang");
        return;
      }
      setRows(data.data);
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    void muat();
  }, [muat]);

  return (
    <div className="space-y-4">
      <FilterBar filter={filter} onChange={setFilter} outlets={outlets} pihakLabel="Customer / Agen" />

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Belum ada piutang"
          description="Piutang muncul otomatis dari transaksi POS/B2B yang belum lunas."
        />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const overdue = r.status !== "LUNAS" ? hariOverdue(r.jatuhTempo) : 0;
            const isOverdue = overdue > 0;
            const overdueParah = isOverdue && overdue > 30;
            return (
              <DataCard
                key={r.id}
                onClick={() => {
                  setSelectedId(r.id);
                  setSelectedNama(r.pihakNama);
                }}
                tone={overdueParah ? "danger" : isOverdue ? "warning" : "default"}
                title={r.pihakNama}
                badge={<StatusBadge status={r.status} />}
                subtitle={`${r.sumber ? `${r.sumber} ${r.nomorTransaksi ?? ""}` : "Tanpa nomor"} · ${r.outletNama ?? "Tanpa outlet"}`}
                meta={
                  isOverdue
                    ? `Jatuh tempo ${formatTanggal(r.jatuhTempo)} · Terlambat ${overdue} hari`
                    : `Jatuh tempo ${formatTanggal(r.jatuhTempo)}`
                }
                amount={
                  <span>
                    <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">Sisa</span>
                    {formatRupiah(r.sisa)}
                  </span>
                }
              />
            );
          })}
        </div>
      )}

      <PembayaranDialog
        open={selectedId !== null}
        onOpenChange={(o) => !o && setSelectedId(null)}
        tipe="PIUTANG"
        id={selectedId}
        pihakNamaAwal={selectedNama}
        canBayar={canBayar}
        onSukses={() => void muat()}
      />
    </div>
  );
}
