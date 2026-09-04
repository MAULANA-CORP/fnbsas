"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/empty-state";
import { formatRupiah, formatTanggal } from "@/lib/utils";

interface Ringkasan {
  jumlahToko: number;
  free: number;
  pro: number;
  business: number;
  suspend: number;
  pendingBayar: number;
  omzetBulanIni: number;
  hampirHabis: Array<{
    id: string;
    namaUsaha: string;
    tier: string;
    periode: string | null;
    paidUntil: string;
    sisaHari: number | null;
  }>;
}

export default function AdminHomePage() {
  const [data, setData] = React.useState<Ringkasan | null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/ringkasan");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal memuat ringkasan");
        return;
      }
      setData(json);
    })();
  }, []);

  if (!data) return <LoadingSkeleton />;

  const cards = [
    { label: "Semua toko", value: data.jumlahToko, href: "/admin/tenants" },
    { label: "FREE", value: data.free, href: "/admin/tenants" },
    { label: "PRO", value: data.pro, href: "/admin/tenants" },
    { label: "BUSINESS", value: data.business, href: "/admin/tenants" },
    { label: "Menunggu bayar", value: data.pendingBayar, href: "/admin/pembayaran" },
    { label: "Dinonaktifkan", value: data.suspend, href: "/admin/tenants" },
  ];

  return (
    <div>
      <PageHeader title="Ringkasan" description="Semua tenant, pembayaran, dan omzet langganan bulan ini." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="hover:border-blue-300 dark:hover:border-blue-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50">{c.value}</p>
            </Card>
          </Link>
        ))}
        <Card>
          <p className="text-sm text-gray-600 dark:text-gray-400">Omzet langganan bulan ini</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {formatRupiah(data.omzetBulanIni)}
          </p>
        </Card>
      </div>

      <h2 className="mt-8 text-base font-semibold text-gray-900 dark:text-gray-50">Habis dalam 7 hari</h2>
      {data.hampirHabis.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Tidak ada paket yang hampir habis.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2 font-medium">Toko</th>
                <th className="px-4 py-2 font-medium">Paket</th>
                <th className="px-4 py-2 font-medium">Periode</th>
                <th className="px-4 py-2 font-medium">Sampai</th>
                <th className="px-4 py-2 font-medium">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {data.hampirHabis.map((t) => (
                <tr key={t.id} className="border-t border-gray-200 dark:border-zinc-700">
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-50">{t.namaUsaha}</td>
                  <td className="px-4 py-2">
                    <Badge tone={t.tier === "BUSINESS" ? "amber" : "blue"}>{t.tier}</Badge>
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{t.periode ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{formatTanggal(t.paidUntil)}</td>
                  <td className="px-4 py-2 text-amber-800 dark:text-amber-300">{t.sisaHari} hari</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
