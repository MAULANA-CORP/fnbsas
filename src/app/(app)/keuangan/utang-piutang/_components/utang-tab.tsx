"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataCard } from "@/components/ui/data-card";
import { LoadingSkeleton, EmptyState } from "@/components/ui/empty-state";
import { formatRupiah, formatTanggal, hariOverdue } from "@/lib/utils";
import { FilterBar } from "./filter-bar";
import { PembayaranDialog } from "./pembayaran-dialog";
import { FILTER_KOSONG, filterKeQuery } from "./types";
import type { FilterState, OutletOption, UtangRow } from "./types";

const SUMBER_OPTIONS = [
  { value: "PEMBELIAN", label: "Pembelian" },
  { value: "PINJAMAN", label: "Pinjaman" },
  { value: "INVESTOR", label: "Investor" },
];

const SUMBER_LABEL: Record<string, string> = {
  PEMBELIAN: "Pembelian",
  PINJAMAN: "Pinjaman",
  INVESTOR: "Investor",
};

export function UtangTab({ outlets }: { outlets: OutletOption[] }) {
  const [filter, setFilter] = React.useState<FilterState>(FILTER_KOSONG);
  const [sumber, setSumber] = React.useState<string>("");
  const [rows, setRows] = React.useState<UtangRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedNama, setSelectedNama] = React.useState<string | undefined>(undefined);

  const muat = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = filterKeQuery(filter, { sumber });
      const res = await fetch(`/api/utang${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal memuat data utang");
        return;
      }
      setRows(data.data);
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [filter, sumber]);

  React.useEffect(() => {
    void muat();
  }, [muat]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterBar
          filter={filter}
          onChange={setFilter}
          outlets={outlets}
          pihakLabel="Supplier / Pemberi Pinjaman"
          extra={
            <SearchableSelect
              label="Sumber"
              placeholder="Semua sumber"
              options={SUMBER_OPTIONS}
              value={sumber || null}
              onChange={(v) => setSumber(v ?? "")}
            />
          }
        />
      </div>

      <div className="flex justify-end">
        <Link href="/keuangan/pembelian">
          <Button type="button" size="sm">
            <Plus className="h-4 w-4" />
            Catat Pembelian / Utang Baru
          </Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Belum ada utang"
          description="Catat pembelian dari supplier, pinjaman, atau dana investor lewat tombol di atas."
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
                badge={
                  <>
                    <Badge tone={r.sumber === "PEMBELIAN" ? "blue" : "gray"}>
                      {SUMBER_LABEL[r.sumber] ?? r.sumber}
                    </Badge>
                    <StatusBadge status={r.status} />
                  </>
                }
                subtitle={`${r.outletNama ?? "Tanpa outlet"}${r.nomorPembelian ? ` · ${r.nomorPembelian}` : ""}`}
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
        tipe="UTANG"
        id={selectedId}
        pihakNamaAwal={selectedNama}
        canBayar
        onSukses={() => void muat()}
      />
    </div>
  );
}
