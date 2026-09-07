"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataCard } from "@/components/ui/data-card";
import { EmptyState, LoadingSkeleton } from "@/components/ui/empty-state";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { OrderStatusBadge, STATUS_FILTERS } from "./order-status-badge";
import type { OrderB2BDTO } from "./types";

export function OrderListClient({ role }: { role: "OWNER" | "FINANCE" | "SALES" | "PRODUKSI" }) {
  const [orders, setOrders] = React.useState<OrderB2BDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<string>("SEMUA");
  const [q, setQ] = React.useState("");

  const bisaBuatOrder = role === "OWNER" || role === "SALES";

  const muatData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "SEMUA") params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/b2b/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal memuat data order");
        return;
      }
      setOrders(data.data ?? []);
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  React.useEffect(() => {
    const timer = setTimeout(muatData, q ? 350 : 0);
    return () => clearTimeout(timer);
  }, [muatData, q]);

  return (
    <div>
      <PageHeader
        title="B2B — Penjualan ke Agen"
        description="Order, invoice, pengiriman, dan pembayaran untuk Agen/Distributor."
        action={
          bisaBuatOrder ? (
            <Link href="/b2b/baru">
              <Button>
                <Plus className="h-4 w-4" />
                Buat Order
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            placeholder="Cari nomor order / nama agen..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <SearchableSelect
            placeholder="Semua Status"
            options={STATUS_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
            value={status}
            onChange={(v) => setStatus(v ?? "SEMUA")}
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : orders.length === 0 ? (
          <EmptyState
            title="Belum ada order B2B"
            description="Order yang dibuat untuk Agen/Distributor akan muncul di sini."
            action={
              bisaBuatOrder ? (
                <Link href="/b2b/baru">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Buat Order Pertama
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <DataCard
                key={o.id}
                href={`/b2b/${o.id}`}
                icon={Briefcase}
                title={o.nomor}
                badge={<OrderStatusBadge status={o.status} />}
                subtitle={`${o.agen?.nama ?? "-"} · ${o.outlet?.nama ?? "-"}`}
                meta={`${formatTanggal(o.createdAt)}${o.metodeBayar === "CASH" ? " · Cash" : o.metodeBayar === "KREDIT" ? " · Kredit" : ""}`}
                amount={formatRupiah(o.total)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
