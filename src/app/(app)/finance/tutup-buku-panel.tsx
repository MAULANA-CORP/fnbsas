"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState, LoadingSkeleton } from "@/components/ui/empty-state";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { todayStr } from "./_lib";

interface Row {
  id: string;
  tanggal: string;
  saldoSistem: number;
  aktualKas: number;
  selisih: number;
  catatan: string | null;
  namaUser: string;
}

export function TutupBukuPanel() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [tanggal, setTanggal] = React.useState(todayStr());
  const [aktualKas, setAktualKas] = React.useState("");
  const [catatan, setCatatan] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/closing");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal memuat tutup buku");
        return;
      }
      setRows(data.data ?? []);
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nilai = Number(aktualKas);
    if (!Number.isFinite(nilai)) {
      toast.error("Isi kas aktual");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/finance/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktualKas: nilai, tanggal, catatan }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal tutup buku");
        return;
      }
      toast.success(data.message ?? "Tutup buku tercatat");
      setAktualKas("");
      setCatatan("");
      load();
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tutup buku harian</CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Setelah ditutup, transaksi (POS, pembayaran, pengeluaran, modal) sampai tanggal itu tidak bisa diubah.
        </p>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
          <Input
            label="Kas aktual di laci (Rp)"
            type="number"
            min={0}
            value={aktualKas}
            onChange={(e) => setAktualKas(e.target.value)}
            required
          />
          <div className="sm:col-span-2">
            <Textarea label="Catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </div>
          <Button type="submit" loading={saving}>
            Tutup buku
          </Button>
        </form>
      </Card>

      {loading ? (
        <Card>
          <LoadingSkeleton rows={4} />
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState title="Belum ada tutup buku" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-zinc-700 dark:text-gray-400">
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3 text-right">Sistem</th>
                  <th className="py-2 pr-3 text-right">Aktual</th>
                  <th className="py-2 pr-3 text-right">Selisih</th>
                  <th className="py-2 pr-0">Oleh</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-zinc-800">
                    <td className="py-2 pr-3">{formatTanggal(r.tanggal)}</td>
                    <td className="py-2 pr-3 text-right">{formatRupiah(r.saldoSistem)}</td>
                    <td className="py-2 pr-3 text-right">{formatRupiah(r.aktualKas)}</td>
                    <td className="py-2 pr-3 text-right">{formatRupiah(r.selisih)}</td>
                    <td className="py-2 pr-0">{r.namaUser}</td>
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
