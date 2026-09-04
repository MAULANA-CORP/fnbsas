# Cek 1–1 — Gampangin SaaS

Urutan cek. Centang sendiri. Password seed default: `admin123`.

## 0. Jalanin dulu

```bash
npx prisma db push
npm run db:seed
npm run dev
```

Buka http://localhost:3000

---

## 1. Landing & daftar

- [ ] `/` tampil landing (bukan langsung login)
- [ ] Ada harga FREE / PRO / BUSINESS
- [ ] `/daftar` bikin toko baru, masuk dashboard paket FREE

## 2. Isolasi 2 toko

- [ ] Login `admin` → Database ada customer **Pelanggan Umum** toko Gampangin
- [ ] Logout, login `demo2` → Database **tidak** ada data `admin`, cuma Dapur Sebelah
- [ ] Nama toko di sidebar beda

## 3. Kuota FREE

- [ ] Banner "Paket FREE · x/50 transaksi"
- [ ] Menu **Langganan** ada di Owner
- [ ] (Opsional) bikin transaksi sampai 50, yang ke-51 ditolak + tombol Upgrade

## 4. Bayar manual

- [ ] `admin` → Langganan → pilih PRO bulanan → upload bukti (gambar)
- [ ] Status jadi menunggu
- [ ] Logout, login `superadmin` → `/admin` → Aktifkan
- [ ] Login `admin` lagi → badge **PRO**, transaksi unlimited

## 5. Perpanjang

- [ ] Owner PRO buka Langganan → masih bisa bayar lagi (bukan cuma FREE)
- [ ] Kalau aktifkan lagi, tanggal habis mundur dari sisa masa (bukan reset ke hari ini)

## 6. Midtrans (kalau key sudah diisi)

Isi `MIDTRANS_SERVER_KEY` + `MIDTRANS_CLIENT_KEY` sandbox di `.env`, restart.

- [ ] Tombol **Bayar via Midtrans** muncul
- [ ] Popup Snap terbuka
- [ ] Webhook: `http://localhost:3000/api/subscription/midtrans/notification` (pakai ngrok kalau tes dari dashboard Midtrans)
- [ ] Setelah settlement, paket aktif tanpa klik admin
- [ ] Kosongkan key → tombol Midtrans hilang, transfer manual tetap ada

## 7. Admin platform

- [ ] `superadmin` tidak masuk dashboard toko, langsung `/admin`
- [ ] Filter Menunggu / Diaktifkan / Ditolak
- [ ] Daftar tenant di `/admin/tenants`

## 8. Deploy (kamu yang klik)

- [ ] Env lengkap di EasyPanel (lihat `DEPLOY_EASYPANEL.md`)
- [ ] `npx prisma db push` + `npm run db:seed` di container
- [ ] Ganti password `admin` / `demo2` / `superadmin`
- [ ] Domain + webhook Midtrans production (kalau dipakai)
