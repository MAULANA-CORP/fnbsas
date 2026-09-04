"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DaftarPage() {
  const router = useRouter();
  const [namaUsaha, setNamaUsaha] = React.useState("");
  const [namaOwner, setNamaOwner] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaUsaha, namaOwner, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal daftar");
        return;
      }
      toast.success(`Toko ${data.tenant.namaUsaha} siap. Paket FREE.`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-xl bg-[#B42318] p-3">
            <Store className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Daftar toko</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Paket FREE: semua fitur, 50 transaksi/bulan, 1 outlet.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nama usaha" required value={namaUsaha} onChange={(e) => setNamaUsaha(e.target.value)} />
          <Input label="Nama pemilik" required value={namaOwner} onChange={(e) => setNamaOwner(e.target.value)} />
          <Input
            label="Username"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full bg-[#B42318] hover:bg-[#8F1A12] dark:bg-[#B42318]" loading={loading}>
            Buat akun
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-blue-700 dark:text-blue-400">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
