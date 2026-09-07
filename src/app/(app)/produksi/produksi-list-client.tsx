"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Beaker, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataCard } from "@/components/ui/data-card";
import { EmptyState, LoadingSkeleton } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatRupiah, formatTanggal } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipe data
// ---------------------------------------------------------------------------

interface ProsesRingkas {
  id: string;
  nomor: string;
  nama: string | null;
  tanggal: string;
  status: string;
  catatan: string | null;
  totalBiaya: number;
  outlet: { id: string; nama: string };
  user: { id: string; nama: string };
  jumlahBahanBaku: number;
}

interface OutputRingkas {
  id: string;
  nomor: string;
  tanggal: string;
  catatan: string | null;
  totalBiaya: number;
  outlet: { id: string; nama: string };
  user: { id: string; nama: string };
  jumlahProses: number;
  proses: { id: string; nomor: string; nama: string | null }[];
  produkJadi: { id: string; produkJadi: { id: string; nama: string; satuan: string }; qty: number; hppAlokasi: number }[];
  jumlahKemasan: number;
}

function statusBadge(status: string) {
  const map: Record<string, { tone: "gray" | "green" | "red"; label: string }> = {
    DRAFT: { tone: "gray", label: "Draft" },
    SELESAI: { tone: "green", label: "Selesai" },
    DIBATALKAN: { tone: "red", label: "Dibatalan" },
  };
  const s = map[status] ?? { tone: "gray" as const, label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

// ---------------------------------------------------------------------------
// Tab Proses
// ---------------------------------------------------------------------------

function ProsesTab() {
  const [data, setData] = React.useState<ProsesRingkas[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filterDari, setFilterDari] = React.useState("");
  const [filterSampai, setFilterSampai] = React.useState("");

  const muat = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDari) params.set("dari", filterDari);
      if (filterSampai) params.set("sampai", filterSampai);
      const res = await fetch(`/api/produksi/proses?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal memuat data proses");
        return;
      }
      setData(json.data);
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [filterDari, filterSampai]);

  React.useEffect(() => {
    muat();
  }, [muat]);

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-end">
        <Input type="date" label="Dari Tanggal" value={filterDari} onChange={(e) => setFilterDari(e.target.value)} />
        <Input type="date" label="Sampai Tanggal" value={filterSampai} onChange={(e) => setFilterSampai(e.target.value)} />
        <Button variant="secondary" onClick={muat}>Terapkan</Button>
        {(filterDari || filterSampai) && (
          <Button variant="ghost" onClick={() => { setFilterDari(""); setFilterSampai(""); }}>Reset</Button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Belum ada proses produksi"
          description="Mulai catat proses pertama untuk melihat riwayatnya di sini."
          action={
            <Link href="/produksi/proses/baru">
              <Button>
                <Plus className="h-4 w-4" />
                Buat Proses Baru
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {data.map((p) => (
            <DataCard
              key={p.id}
              href={`/produksi/proses/${p.id}`}
              icon={Beaker}
              title={p.nomor}
              badge={statusBadge(p.status)}
              subtitle={`${p.nama ?? "Tanpa nama"} · ${p.outlet.nama}`}
              meta={`${formatTanggal(p.tanggal)} · ${p.jumlahBahanBaku} bahan · oleh ${p.user.nama}`}
              amount={formatRupiah(p.totalBiaya)}
            />
          ))}
        </div>
      )}

      {!loading && data && data.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
          <Beaker className="h-3.5 w-3.5" />
          Menampilkan {data.length} proses terakhir.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab Output
// ---------------------------------------------------------------------------

function OutputTab() {
  const [data, setData] = React.useState<OutputRingkas[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filterDari, setFilterDari] = React.useState("");
  const [filterSampai, setFilterSampai] = React.useState("");

  const muat = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDari) params.set("dari", filterDari);
      if (filterSampai) params.set("sampai", filterSampai);
      const res = await fetch(`/api/produksi/output?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal memuat data output");
        return;
      }
      setData(json.data);
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [filterDari, filterSampai]);

  React.useEffect(() => {
    muat();
  }, [muat]);

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-end">
        <Input type="date" label="Dari Tanggal" value={filterDari} onChange={(e) => setFilterDari(e.target.value)} />
        <Input type="date" label="Sampai Tanggal" value={filterSampai} onChange={(e) => setFilterSampai(e.target.value)} />
        <Button variant="secondary" onClick={muat}>Terapkan</Button>
        {(filterDari || filterSampai) && (
          <Button variant="ghost" onClick={() => { setFilterDari(""); setFilterSampai(""); }}>Reset</Button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Belum ada output produksi"
          description="Buat output dari proses yang sudah selesai untuk mencatat produk jadi."
          action={
            <Link href="/produksi/output/baru">
              <Button>
                <Plus className="h-4 w-4" />
                Buat Output Baru
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {data.map((o) => (
            <DataCard
              key={o.id}
              href={`/produksi/output/${o.id}`}
              icon={Package}
              title={o.nomor}
              subtitle={o.produkJadi.map((op) => `${op.produkJadi.nama} ×${op.qty}`).join(", ") || "Belum ada produk"}
              meta={`${formatTanggal(o.tanggal)} · ${o.outlet.nama} · oleh ${o.user.nama}`}
              amount={formatRupiah(o.totalBiaya)}
            />
          ))}
        </div>
      )}

      {!loading && data && data.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
          <Package className="h-3.5 w-3.5" />
          Menampilkan {data.length} output terakhir.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Halaman utama dengan Tabs
// ---------------------------------------------------------------------------

export function ProduksiListClient() {
  return (
    <div>
      <PageHeader
        title="Proses Produksi"
        description="Kelola proses masak (bahan baku) dan output (produk jadi + kemasan) secara terpisah."
      />

      <Tabs defaultValue="proses">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="proses" className="flex-1 sm:flex-none">
            <Beaker className="mr-1.5 h-4 w-4" /> Proses
          </TabsTrigger>
          <TabsTrigger value="output" className="flex-1 sm:flex-none">
            <Package className="mr-1.5 h-4 w-4" /> Output
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proses">
          <div className="mb-4">
            <Link href="/produksi/proses/baru">
              <Button size="lg">
                <Plus className="h-4 w-4" />
                Buat Proses Baru
              </Button>
            </Link>
          </div>
          <Card>
            <ProsesTab />
          </Card>
        </TabsContent>

        <TabsContent value="output">
          <div className="mb-4">
            <Link href="/produksi/output/baru">
              <Button size="lg">
                <Plus className="h-4 w-4" />
                Buat Output Baru
              </Button>
            </Link>
          </div>
          <Card>
            <OutputTab />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
