"use client";

import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/empty-state";

export default function AdminPengaturanPage() {
  const [bank, setBank] = React.useState("");
  const [nomor, setNomor] = React.useState("");
  const [atasNama, setAtasNama] = React.useState("");
  const [qrisUrl, setQrisUrl] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/pengaturan");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal memuat rekening");
        setLoading(false);
        return;
      }
      setBank(json.rekening.bank);
      setNomor(json.rekening.nomor);
      setAtasNama(json.rekening.atasNama);
      setQrisUrl(json.rekening.qrisUrl ?? "");
      setLoading(false);
    })();
  }, []);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pengaturan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank, nomor, atasNama, qrisUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Gagal menyimpan");
        return;
      }
      toast.success("Rekening transfer diperbarui. Toko akan lihat ini saat upgrade.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div>
      <PageHeader
        title="Rekening"
        description="Nomor rekening / QRIS yang tampil di halaman Langganan toko. Tidak perlu edit .env."
      />
      <Card className="max-w-lg">
        <form onSubmit={simpan} className="space-y-4">
          <Input label="Bank" required value={bank} onChange={(e) => setBank(e.target.value)} />
          <Input label="Nomor rekening" required value={nomor} onChange={(e) => setNomor(e.target.value)} />
          <Input label="Atas nama" required value={atasNama} onChange={(e) => setAtasNama(e.target.value)} />
          <Input
            label="URL gambar QRIS (opsional)"
            value={qrisUrl}
            onChange={(e) => setQrisUrl(e.target.value)}
            placeholder="https://..."
          />
          <Button type="submit" loading={saving}>
            Simpan
          </Button>
        </form>
      </Card>
    </div>
  );
}
