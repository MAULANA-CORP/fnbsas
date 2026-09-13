"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/components/ui/empty-state";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { exportRowsToExcel } from "@/lib/export-excel";
import { exportRowsToPdf } from "@/lib/export-pdf";

interface Row {
  id: string;
  tanggal: string;
  kategori: string;
  jumlah: number;
  keterangan: string | null;
  outlet: { nama: string } | null;
}

export function LaporanPengeluaranClient() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/pengeluaran")
      .then((r) => r.json())
      .then((d) => setRows(d.pengeluaran ?? d.data ?? []))
      .catch(() => toast.error("Gagal memuat pengeluaran"))
      .finally(() => setLoading(false));
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.jumlah), 0);

  function exportExcel() {
    exportRowsToExcel({
      modul: "pengeluaran",
      sheetName: "Pengeluaran",
      columns: [
        { header: "Tanggal", accessor: (r: Row) => formatTanggal(r.tanggal), width: 14 },
        { header: "Kategori", accessor: (r: Row) => r.kategori, width: 18 },
        { header: "Outlet", accessor: (r: Row) => r.outlet?.nama ?? "—", width: 16 },
        { header: "Jumlah", accessor: (r: Row) => r.jumlah, width: 16 },
        { header: "Keterangan", accessor: (r: Row) => r.keterangan ?? "", width: 28 },
      ],
      rows,
    });
    toast.success("Excel diunduh");
  }

  function exportPdf() {
    exportRowsToPdf({
      judul: "Laporan Pengeluaran",
      modul: "pengeluaran",
      columns: ["Tanggal", "Kategori", "Outlet", "Jumlah", "Keterangan"],
      rows: rows.map((r) => [
        formatTanggal(r.tanggal),
        r.kategori,
        r.outlet?.nama ?? "—",
        formatRupiah(r.jumlah),
        r.keterangan ?? "",
      ]),
    });
    toast.success("PDF diunduh");
  }

  if (loading) {
    return (
      <Card>
        <LoadingSkeleton rows={6} />
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Laporan Pengeluaran"
        description="Beban operasional per periode. Export Excel atau PDF."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportExcel} disabled={!rows.length}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={exportPdf} disabled={!rows.length}>
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
        }
      />
      <p className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-50">Total {formatRupiah(total)}</p>
      {rows.length === 0 ? (
        <EmptyState title="Belum ada pengeluaran" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-zinc-700 dark:text-gray-400">
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">Kategori</th>
                  <th className="py-2 pr-3">Outlet</th>
                  <th className="py-2 pr-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-zinc-800">
                    <td className="py-2 pr-3">{formatTanggal(r.tanggal)}</td>
                    <td className="py-2 pr-3">{r.kategori}</td>
                    <td className="py-2 pr-3">{r.outlet?.nama ?? "—"}</td>
                    <td className="py-2 pr-0 text-right">{formatRupiah(r.jumlah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
