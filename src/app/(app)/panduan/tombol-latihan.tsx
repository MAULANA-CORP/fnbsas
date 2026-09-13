"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function TombolLatihan() {
  const [loading, setLoading] = React.useState(false);
  async function isi() {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/data-latihan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengisi data latihan");
        return;
      }
      toast.success(data.message ?? "Data latihan siap");
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button type="button" variant="secondary" onClick={isi} loading={loading}>
      Isi data latihan
    </Button>
  );
}
