"use client";

import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LoadingSkeleton } from "@/components/ui/empty-state";
import { formatRupiah, formatTanggal } from "@/lib/utils";

interface Ringkasan {
  namaUsaha: string;
  tier: "FREE" | "PRO" | "BUSINESS";
  periode: "BULANAN" | "TAHUNAN" | null;
  status: string;
  paidUntil: string | null;
  sisaHari: number | null;
  maxOutlet: number;
  maxTransaksiBulan: number | null;
  transaksiTerpakai: number;
  transaksiSisa: number | null;
  pendingPembayaran: {
    id: string;
    targetTier: string;
    periode: string;
    jumlah: number;
    channel: "MANUAL" | "MIDTRANS";
    buktiUrl: string | null;
    createdAt: string;
  } | null;
  harga: {
    PRO: { BULANAN: number; TAHUNAN: number };
    BUSINESS: { BULANAN: number; TAHUNAN: number };
  };
  rekening: { bank: string; nomor: string; atasNama: string; qrisUrl: string };
  midtrans: { enabled: boolean; clientKey: string; snapUrl: string };
}

const TIER_TONE = {
  FREE: "gray" as const,
  PRO: "blue" as const,
  BUSINESS: "amber" as const,
};

declare global {
  interface Window {
    snap?: { pay: (token: string, cb: Record<string, () => void>) => void };
  }
}

function loadSnap(url: string, clientKey: string): Promise<NonNullable<Window["snap"]>> {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve(window.snap);
      return;
    }
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      existing.addEventListener("load", () =>
        window.snap ? resolve(window.snap) : reject(new Error("Snap gagal"))
      );
      return;
    }
    const s = document.createElement("script");
    s.src = url;
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => (window.snap ? resolve(window.snap) : reject(new Error("Snap gagal")));
    s.onerror = () => reject(new Error("Tidak bisa memuat Midtrans"));
    document.body.appendChild(s);
  });
}

export function LanggananClient() {
  const [data, setData] = React.useState<Ringkasan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [targetTier, setTargetTier] = React.useState("PRO");
  const [periode, setPeriode] = React.useState("BULANAN");
  const [catatan, setCatatan] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [sending, setSending] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const [kodeVoucher, setKodeVoucher] = React.useState("");
  const [voucher, setVoucher] = React.useState<{
    kode: string;
    diskon: number;
    bayar: number;
    harga: number;
  } | null>(null);
  const [cekVoucher, setCekVoucher] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal memuat langganan");
        return;
      }
      setData(json);
      if (json.tier === "BUSINESS") setTargetTier("BUSINESS");
      else if (json.tier === "PRO") setTargetTier("PRO");
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const hargaAsli =
    data && (targetTier === "PRO" || targetTier === "BUSINESS") && (periode === "BULANAN" || periode === "TAHUNAN")
      ? data.harga[targetTier as "PRO" | "BUSINESS"][periode as "BULANAN" | "TAHUNAN"]
      : 0;
  const jumlah = voucher ? voucher.bayar : hargaAsli;

  React.useEffect(() => {
    setVoucher(null);
  }, [targetTier, periode]);

  const judulForm =
    data?.tier === "FREE" || data?.status === "EXPIRED" ? "Naik paket" : "Perpanjang / ganti paket";

  async function kirimManual(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Upload bukti transfer dulu");
      return;
    }
    setSending(true);
    try {
      const form = new FormData();
      form.set("targetTier", targetTier);
      form.set("periode", periode);
      form.set("catatan", catatan);
      if (voucher) form.set("kodeVoucher", voucher.kode);
      form.set("bukti", file);
      const res = await fetch("/api/subscription/upgrade", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal kirim bukti");
        return;
      }
      toast.success("Bukti terkirim. Kami cek lalu aktifkan paketnya.");
      setFile(null);
      setCatatan("");
      await load();
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setSending(false);
    }
  }

  async function pakaiVoucher() {
    setCekVoucher(true);
    try {
      const res = await fetch("/api/subscription/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: kodeVoucher, targetTier, periode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setVoucher(null);
        toast.error(json.error ?? "Voucher tidak valid");
        return;
      }
      setVoucher({ kode: json.voucher.kode, diskon: json.diskon, bayar: json.bayar, harga: json.harga });
      toast.success(`Voucher ${json.voucher.kode} dipakai`);
    } finally {
      setCekVoucher(false);
    }
  }

  async function aktifkanGratis() {
    setSending(true);
    try {
      const form = new FormData();
      form.set("targetTier", targetTier);
      form.set("periode", periode);
      if (voucher) form.set("kodeVoucher", voucher.kode);
      const res = await fetch("/api/subscription/upgrade", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal memakai voucher");
        return;
      }
      toast.success("Voucher dipakai. Paket sudah aktif.");
      await load();
    } finally {
      setSending(false);
    }
  }

  async function bayarMidtrans() {
    if (!data?.midtrans.enabled) return;
    setPaying(true);
    try {
      const res = await fetch("/api/subscription/midtrans/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTier, periode, kodeVoucher: voucher?.kode ?? null }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal membuat pembayaran");
        return;
      }
      if (json.gratis) {
        toast.success("Voucher dipakai. Paket sudah aktif.");
        await load();
        return;
      }
      const snap = await loadSnap(data.midtrans.snapUrl, data.midtrans.clientKey);
      snap.pay(json.token, {
        onSuccess: () => {
          toast.success("Pembayaran diterima. Paket segera aktif.");
          load();
        },
        onPending: () => {
          toast.success("Menunggu pembayaran. Kalau sudah transfer, paket aktif sendiri.");
          load();
        },
        onError: () => toast.error("Pembayaran gagal"),
        onClose: () => load(),
      });
    } catch {
      toast.error("Tidak bisa membuka Midtrans");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <LoadingSkeleton />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title="Langganan"
        description="Naik paket, perpanjang, atau ganti PRO/BUSINESS. Transfer manual tetap bisa; Midtrans otomatis kalau kuncinya sudah diisi."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-600 dark:text-gray-400">Paket sekarang</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={TIER_TONE[data.tier]}>{data.tier}</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">{data.status}</span>
          </div>
          {data.periode && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Periode {data.periode === "TAHUNAN" ? "tahunan" : "bulanan"}
            </p>
          )}
          {data.paidUntil && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aktif sampai {formatTanggal(data.paidUntil)}
              {data.sisaHari != null ? ` (${data.sisaHari} hari)` : ""}
            </p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-gray-600 dark:text-gray-400">Transaksi bulan ini</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {data.transaksiTerpakai}
            <span className="text-base font-normal text-gray-600 dark:text-gray-400">
              {" "}
              / {data.maxTransaksiBulan == null ? "∞" : data.maxTransaksiBulan}
            </span>
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 dark:text-gray-400">Outlet</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">max {data.maxOutlet}</p>
        </Card>
      </div>

      {data.sisaHari != null && data.sisaHari >= 0 && data.sisaHari <= 7 && data.tier !== "FREE" && (
        <Card className="mt-4 border-amber-300 dark:border-amber-700">
          <p className="font-semibold text-gray-900 dark:text-gray-50">Paket hampir habis</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Sisa {data.sisaHari} hari. Perpanjang di bawah supaya tidak turun ke FREE.
          </p>
        </Card>
      )}

      {data.pendingPembayaran && (
        <Card className="mt-4 border-amber-300 dark:border-amber-700">
          <p className="font-semibold text-gray-900 dark:text-gray-50">Menunggu pembayaran</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {data.pendingPembayaran.channel === "MIDTRANS" ? "Midtrans" : "Transfer manual"} ·{" "}
            {data.pendingPembayaran.targetTier} ({data.pendingPembayaran.periode.toLowerCase()}){" "}
            {formatRupiah(data.pendingPembayaran.jumlah)} — {formatTanggal(data.pendingPembayaran.createdAt)}.
          </p>
        </Card>
      )}

      {!data.pendingPembayaran && (
        <Card className="mt-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">{judulForm}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Kalau paket masih aktif, masa berlaku dihitung dari tanggal habis (bukan dari hari ini).
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SearchableSelect
              label="Paket"
              value={targetTier}
              onChange={(v) => setTargetTier(v ?? "PRO")}
              options={[
                { value: "PRO", label: `PRO — ${formatRupiah(data.harga.PRO.BULANAN)}/bln` },
                { value: "BUSINESS", label: `BUSINESS — ${formatRupiah(data.harga.BUSINESS.BULANAN)}/bln` },
              ]}
            />
            <SearchableSelect
              label="Periode"
              value={periode}
              onChange={(v) => setPeriode(v ?? "BULANAN")}
              options={[
                { value: "BULANAN", label: "Bulanan" },
                { value: "TAHUNAN", label: "Tahunan (bayar 10 bulan)" },
              ]}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input
              label="Kode voucher"
              placeholder="TEMAN50"
              value={kodeVoucher}
              onChange={(e) => setKodeVoucher(e.target.value.toUpperCase())}
            />
            <Button type="button" variant="secondary" loading={cekVoucher} onClick={pakaiVoucher}>
              Pakai
            </Button>
          </div>
          {voucher && (
            <p className="mt-2 text-sm text-green-800 dark:text-green-300">
              {voucher.kode}: potongan {formatRupiah(voucher.diskon)}
            </p>
          )}

          <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            {voucher && voucher.diskon > 0 && (
              <span className="mr-2 text-gray-500 line-through dark:text-gray-400">{formatRupiah(hargaAsli)}</span>
            )}
            Bayar: <span className="font-semibold text-gray-900 dark:text-gray-50">{formatRupiah(jumlah)}</span>
          </p>

          {jumlah === 0 && voucher && (
            <div className="mt-4">
              <Button type="button" loading={sending} onClick={aktifkanGratis}>
                Aktifkan paket (gratis)
              </Button>
            </div>
          )}

          {jumlah > 0 && data.midtrans.enabled && (
            <div className="mt-4">
              <Button type="button" loading={paying} onClick={bayarMidtrans}>
                Bayar via Midtrans
              </Button>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                QRIS, VA, e-wallet. Paket aktif otomatis setelah bayar.
              </p>
            </div>
          )}

          {jumlah > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4 dark:border-zinc-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Atau transfer manual</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {data.rekening.bank} {data.rekening.nomor} a.n. {data.rekening.atasNama}
            </p>
            {data.rekening.qrisUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.rekening.qrisUrl} alt="QRIS" className="mt-3 h-40 w-40 rounded-lg border object-contain dark:border-zinc-700" />
            )}
            <form onSubmit={kirimManual} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Bukti transfer / QRIS"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea label="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} />
              </div>
              <div>
                <Button type="submit" variant="secondary" loading={sending}>
                  Kirim bukti
                </Button>
              </div>
            </form>
          </div>
          )}
        </Card>
      )}
    </div>
  );
}
