import Link from "next/link";
import { getCurrentUser } from "@/lib/api-helpers";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import { HARGA_LANGGANAN } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (user?.role === "PLATFORM_ADMIN") redirect("/admin");
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#E8EEF2] text-[#172027] dark:bg-[#10151a] dark:text-[#E8EEF2]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          Gampangin
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <a href="#harga" className="hidden text-[#5C6B73] hover:text-[#172027] dark:text-zinc-400 dark:hover:text-zinc-100 sm:inline">
            Harga
          </a>
          <Link href="/login" className="rounded-lg px-3 py-2 font-medium text-[#172027] hover:bg-white/70 dark:text-zinc-100 dark:hover:bg-zinc-800">
            Masuk
          </Link>
          <Link
            href="/daftar"
            className="rounded-lg bg-[#B42318] px-3 py-2 font-medium text-white hover:bg-[#8F1A12]"
          >
            Coba gratis
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-12">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.22em] text-[#B42318]">
            Untuk dapur yang ngebut
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Struk sudah keluar.
            <br />
            Pembukuannya jangan ketinggalan.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5C6B73] dark:text-zinc-400 sm:text-lg">
            POS, B2B ke agen, produksi batch, stok bahan, utang-piutang, sampai laba rugi.
            Satu app untuk UMKM sambal, chili oil, kue, dan dapur produksi lain.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/daftar"
              className="inline-flex h-11 items-center rounded-lg bg-[#B42318] px-5 text-sm font-semibold text-white hover:bg-[#8F1A12]"
            >
              Pakai FREE — 50 transaksi/bulan
            </Link>
            <a
              href="#harga"
              className="inline-flex h-11 items-center rounded-lg border border-[#172027]/15 bg-white px-5 text-sm font-semibold text-[#172027] hover:bg-[#F4F7F9] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
            >
              Lihat paket
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 rounded-full bg-[#C9892A]/20 blur-3xl dark:bg-[#C9892A]/10" />
          <div className="overflow-hidden rounded-sm bg-[#FFF8E7] text-[#172027] shadow-[0_24px_60px_-20px_rgba(23,32,39,0.45)]">
            <div className="border-b border-dashed border-[#172027]/20 px-5 py-4 text-center">
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em] text-[#5C6B73]">
                Gampangin POS
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">Dapur Cabe Merah</p>
              <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#5C6B73]">4 Sep 2026 · 14:32 WIB</p>
            </div>
            <div className="space-y-2 px-5 py-4 font-[family-name:var(--font-mono)] text-xs">
              {[
                ["Chili oil 150ml", "12", "192.000"],
                ["Sambal bawang", "8", "96.000"],
                ["Keripik tempe", "4", "48.000"],
              ].map(([nama, qty, harga], i) => (
                <div key={nama} className="receipt-line flex justify-between gap-3" style={{ animationDelay: `${0.12 * (i + 1)}s` }}>
                  <span>
                    {nama}
                    <span className="ml-2 text-[#5C6B73]">×{qty}</span>
                  </span>
                  <span>{harga}</span>
                </div>
              ))}
              <div className="receipt-line my-3 border-t border-dashed border-[#172027]/20 pt-3" style={{ animationDelay: "0.5s" }}>
                <div className="flex justify-between font-semibold">
                  <span>TOTAL</span>
                  <span>336.000</span>
                </div>
                <p className="mt-2 text-[10px] text-[#5C6B73]">Stok terpotong · Kas masuk · Siap tutup hari</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#172027]/10 bg-white py-14 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
          {[
            { k: "Kasir 3–5 ketuk", v: "Cari produk, qty, bayar. Tunai, QRIS, atau kredit ke agen." },
            { k: "Produksi ada HPP-nya", v: "Batch bahan + kemasan. HPP ke produk jadi, stok ikut mundur." },
            { k: "Owner lihat uangnya", v: "Arus kas, laba rugi, neraca. Bukan jurnal akuntansi — angka dari transaksi." },
          ].map((item) => (
            <div key={item.k}>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">{item.k}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C6B73] dark:text-zinc-400">{item.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="harga" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.22em] text-[#B42318]">Paket</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">Mulai dari dapur kecil.</h2>
        <p className="mt-2 max-w-xl text-sm text-[#5C6B73] dark:text-zinc-400">
          Bayar transfer / QRIS, upload bukti, kami aktifkan. Belum ada potongan otomatis.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <PaketCard
            nama="FREE"
            harga="Rp 0"
            detail="50 transaksi / bulan · 1 outlet"
            poin={["Semua modul kebuka", "Cocok coba dulu di dapur", "Naik paket kapan saja"]}
          />
          <PaketCard
            nama="PRO"
            harga={formatRupiah(HARGA_LANGGANAN.PRO.BULANAN)}
            detail={`Unlimited transaksi · 1 outlet · atau ${formatRupiah(HARGA_LANGGANAN.PRO.TAHUNAN)} / tahun`}
            poin={["Tanpa batas transaksi", "POS + B2B + produksi + keuangan", "1 outlet / cabang"]}
            unggulan
          />
          <PaketCard
            nama="BUSINESS"
            harga={formatRupiah(HARGA_LANGGANAN.BUSINESS.BULANAN)}
            detail={`Unlimited · max 3 outlet · atau ${formatRupiah(HARGA_LANGGANAN.BUSINESS.TAHUNAN)} / tahun`}
            poin={["Sampai 3 outlet", "Laporan per cabang", "Untuk yang sudah cabang"]}
          />
        </div>
      </section>

      <footer className="border-t border-[#172027]/10 px-4 py-8 text-center text-xs text-[#5C6B73] dark:border-zinc-800 dark:text-zinc-500">
        Gampangin FNB · Dapur rapi, angka rapi.
      </footer>
    </div>
  );
}

function PaketCard({
  nama,
  harga,
  detail,
  poin,
  unggulan,
}: {
  nama: string;
  harga: string;
  detail: string;
  poin: string[];
  unggulan?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 ${
        unggulan
          ? "border-[#B42318] bg-[#B42318] text-white shadow-lg"
          : "border-[#172027]/10 bg-white dark:border-zinc-700 dark:bg-zinc-800"
      }`}
    >
      <p className={`font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] ${unggulan ? "text-white/80" : "text-[#5C6B73] dark:text-zinc-400"}`}>
        {nama}
      </p>
      <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold">{harga}</p>
      <p className={`mt-1 text-sm ${unggulan ? "text-white/80" : "text-[#5C6B73] dark:text-zinc-400"}`}>{detail}</p>
      <ul className="mt-5 flex-1 space-y-2 text-sm">
        {poin.map((p) => (
          <li key={p}>· {p}</li>
        ))}
      </ul>
      <Link
        href="/daftar"
        className={`mt-6 inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold ${
          unggulan
            ? "bg-white text-[#B42318] hover:bg-[#FFF8E7]"
            : "bg-[#172027] text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900"
        }`}
      >
        Daftar
      </Link>
    </div>
  );
}
