"use client";

import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { EmptyState, LoadingSkeleton } from "@/components/ui/empty-state";
import { formatRupiah, formatTanggal } from "@/lib/utils";

interface VoucherRow {
  id: string;
  kode: string;
  tipe: "PERSEN" | "NOMINAL";
  nilai: number;
  berlakuUntuk: string;
  maxPakai: number | null;
  dipakai: number;
  satuPerToko: boolean;
  berlakuSampai: string | null;
  isActive: boolean;
  catatan: string | null;
  pemakai: Array<{ tenantId: string; namaUsaha: string; slug: string; createdAt: string }>;
}

export default function AdminVoucherPage() {
  const [rows, setRows] = React.useState<VoucherRow[] | null>(null);
  const [kode, setKode] = React.useState("");
  const [tipe, setTipe] = React.useState("PERSEN");
  const [nilai, setNilai] = React.useState("50");
  const [berlakuUntuk, setBerlakuUntuk] = React.useState("PRO");
  const [maxPakai, setMaxPakai] = React.useState("20");
  const [berlakuSampai, setBerlakuSampai] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/vouchers");
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Gagal memuat voucher");
      return;
    }
    setRows(json.vouchers);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function buat(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode,
          tipe,
          nilai: Number(nilai),
          berlakuUntuk,
          maxPakai: maxPakai.trim() ? Number(maxPakai) : null,
          satuPerToko: true,
          berlakuSampai: berlakuSampai || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal membuat voucher");
        return;
      }
      toast.success(`Voucher ${json.voucher.kode} siap dibagikan`);
      setKode("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(v: VoucherRow) {
    const res = await fetch(`/api/admin/vouchers/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !v.isActive }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Gagal mengubah voucher");
      return;
    }
    toast.success(v.isActive ? "Voucher dimatikan" : "Voucher diaktifkan");
    await load();
  }

  if (!rows) return <LoadingSkeleton />;

  return (
    <div>
      <PageHeader
        title="Voucher"
        description="Buat kode untuk dibagikan ke teman. Diskon % atau Rp, dipakai di halaman Langganan sebelum bayar."
      />

      <Card className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Voucher baru</h2>
        <form onSubmit={buat} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Kode" required placeholder="TEMAN50" value={kode} onChange={(e) => setKode(e.target.value)} />
          <SearchableSelect
            label="Tipe diskon"
            value={tipe}
            onChange={(v) => setTipe(v ?? "PERSEN")}
            options={[
              { value: "PERSEN", label: "Persen (%)" },
              { value: "NOMINAL", label: "Nominal (Rp)" },
            ]}
          />
          <Input
            label={tipe === "PERSEN" ? "Nilai (%)" : "Nilai (Rp)"}
            type="number"
            required
            min={1}
            max={tipe === "PERSEN" ? 100 : undefined}
            value={nilai}
            onChange={(e) => setNilai(e.target.value)}
          />
          <SearchableSelect
            label="Berlaku untuk"
            value={berlakuUntuk}
            onChange={(v) => setBerlakuUntuk(v ?? "PRO")}
            options={[
              { value: "PRO", label: "PRO saja" },
              { value: "BUSINESS", label: "BUSINESS saja" },
              { value: "SEMUA", label: "PRO dan BUSINESS" },
            ]}
          />
          <Input
            label="Max dipakai (kosong = tak terbatas)"
            type="number"
            min={1}
            value={maxPakai}
            onChange={(e) => setMaxPakai(e.target.value)}
          />
          <Input label="Berlaku sampai (opsional)" type="date" value={berlakuSampai} onChange={(e) => setBerlakuSampai(e.target.value)} />
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" loading={saving}>
              Buat voucher
            </Button>
          </div>
        </form>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="Belum ada voucher" description="Buat kode di atas, lalu bagikan ke teman." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2 font-medium">Kode</th>
                <th className="px-4 py-2 font-medium">Diskon</th>
                <th className="px-4 py-2 font-medium">Paket</th>
                <th className="px-4 py-2 font-medium">Pakai</th>
                <th className="px-4 py-2 font-medium">Sampai</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-t border-gray-200 dark:border-zinc-700">
                  <td className="px-4 py-2 font-mono font-semibold text-gray-900 dark:text-gray-50">{v.kode}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {v.tipe === "PERSEN" ? `${v.nilai}%` : formatRupiah(v.nilai)}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{v.berlakuUntuk}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {v.dipakai}
                    {v.maxPakai != null ? ` / ${v.maxPakai}` : ""}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {v.berlakuSampai ? formatTanggal(v.berlakuSampai) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={v.isActive ? "green" : "gray"}>{v.isActive ? "Aktif" : "Mati"}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="secondary" onClick={() => toggle(v)}>
                      {v.isActive ? "Matikan" : "Aktifkan"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.some((v) => v.pemakai?.length > 0) && (
        <div className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-50">Siapa yang memakai</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-700">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Kode</th>
                  <th className="px-4 py-2 font-medium">Toko</th>
                  <th className="px-4 py-2 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {rows.flatMap((v) =>
                  (v.pemakai ?? []).map((p) => (
                    <tr key={v.id + p.tenantId} className="border-t border-gray-200 dark:border-zinc-700">
                      <td className="px-4 py-2 font-mono text-gray-900 dark:text-gray-50">{v.kode}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{p.namaUsaha}</td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{formatTanggal(p.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
