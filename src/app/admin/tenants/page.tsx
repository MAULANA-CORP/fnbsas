"use client";

import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog } from "@/components/ui/dialog";
import { LoadingSkeleton, EmptyState } from "@/components/ui/empty-state";
import { formatTanggal } from "@/lib/utils";

interface TenantRow {
  id: string;
  namaUsaha: string;
  slug: string;
  tier: "FREE" | "PRO" | "BUSINESS";
  periode: "BULANAN" | "TAHUNAN" | null;
  status: string;
  paidUntil: string | null;
  sisaHari: number | null;
  isSuspended: boolean;
  catatanInternal: string | null;
  createdAt: string;
  ownerUsername: string | null;
  jumlahUser: number;
  jumlahOutlet: number;
  pendingPembayaran: number;
}

const TONE = {
  FREE: "gray" as const,
  PRO: "blue" as const,
  BUSINESS: "amber" as const,
};

function labelPeriode(p: TenantRow["periode"]) {
  if (p === "BULANAN") return "Bulanan";
  if (p === "TAHUNAN") return "Tahunan";
  return "—";
}

export default function AdminTenantsPage() {
  const [rows, setRows] = React.useState<TenantRow[] | null>(null);
  const [q, setQ] = React.useState("");
  const [edit, setEdit] = React.useState<TenantRow | null>(null);
  const [tier, setTier] = React.useState("PRO");
  const [periode, setPeriode] = React.useState("BULANAN");
  const [catatan, setCatatan] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async (cari = q) => {
    const res = await fetch(`/api/admin/tenants?q=${encodeURIComponent(cari)}`);
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Gagal memuat tenant");
      return;
    }
    setRows(json.tenants);
  }, [q]);

  React.useEffect(() => {
    load("");
  }, [load]);

  function open(t: TenantRow) {
    setEdit(t);
    setTier(t.tier === "FREE" ? "PRO" : t.tier);
    setPeriode(t.periode ?? "BULANAN");
    setCatatan(t.catatanInternal ?? "");
  }

  async function patch(id: string, body: Record<string, unknown>, ok: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal menyimpan");
        return;
      }
      toast.success(ok);
      setEdit(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!rows) return <LoadingSkeleton />;

  return (
    <div>
      <PageHeader title="Tenant" description="Paket, periode langganan, suspend, dan catatan internal." />
      <form
        className="mb-4 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <Input
          label="Cari nama usaha / username"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Gampangin atau admin"
        />
      </form>
      {rows.length === 0 ? (
        <EmptyState title="Tidak ada tenant" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2 font-medium">Usaha</th>
                <th className="px-4 py-2 font-medium">Paket</th>
                <th className="px-4 py-2 font-medium">Periode</th>
                <th className="px-4 py-2 font-medium">Berlaku sampai</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-200 dark:border-zinc-700">
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-900 dark:text-gray-50">{r.namaUsaha}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {r.ownerUsername ?? r.slug}
                      {r.catatanInternal ? ` · ${r.catatanInternal}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={TONE[r.tier]}>{r.tier}</Badge>
                    {r.pendingPembayaran > 0 && (
                      <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{labelPeriode(r.periode)}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {r.tier === "FREE" ? "—" : r.paidUntil ? formatTanggal(r.paidUntil) : "—"}
                    {r.sisaHari != null && r.tier !== "FREE" ? ` (${r.sisaHari}h)` : ""}
                  </td>
                  <td className="px-4 py-2">
                    {r.isSuspended ? (
                      <Badge tone="red">Suspend</Badge>
                    ) : (
                      <span className="text-gray-700 dark:text-gray-300">{r.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="secondary" onClick={() => open(r)}>
                      Kelola
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)} title={edit ? `Kelola ${edit.namaUsaha}` : ""}>
        {edit && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sekarang: {edit.tier} · {labelPeriode(edit.periode)}
              {edit.paidUntil ? ` · sampai ${formatTanggal(edit.paidUntil)}` : ""}
            </p>
            <SearchableSelect
              label="Paket"
              value={tier}
              onChange={(v) => setTier(v ?? "PRO")}
              options={[
                { value: "FREE", label: "FREE" },
                { value: "PRO", label: "PRO" },
                { value: "BUSINESS", label: "BUSINESS" },
              ]}
            />
            {tier !== "FREE" && (
              <SearchableSelect
                label="Periode"
                value={periode}
                onChange={(v) => setPeriode(v ?? "BULANAN")}
                options={[
                  { value: "BULANAN", label: "Bulanan" },
                  { value: "TAHUNAN", label: "Tahunan" },
                ]}
              />
            )}
            <Button
              loading={busy}
              onClick={() =>
                patch(edit.id, { action: "set-paket", tier, periode }, `Paket ${edit.namaUsaha} diubah`)
              }
            >
              Simpan paket
            </Button>
            <Textarea label="Catatan internal" rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            <Button
              variant="secondary"
              loading={busy}
              onClick={() => patch(edit.id, { action: "catatan", catatanInternal: catatan }, "Catatan tersimpan")}
            >
              Simpan catatan
            </Button>
            <Button
              variant={edit.isSuspended ? "primary" : "danger"}
              loading={busy}
              onClick={() =>
                patch(
                  edit.id,
                  { action: "suspend", isSuspended: !edit.isSuspended },
                  edit.isSuspended ? "Toko diaktifkan lagi" : "Toko disuspend"
                )
              }
            >
              {edit.isSuspended ? "Buka suspend" : "Suspend toko"}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
