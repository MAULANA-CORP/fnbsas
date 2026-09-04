# SAAS ROADMAP — Gampangin FNB

**Tujuan:** App internal (satu brand) jadi SaaS multi-tenant. Tiap UMKM = 1 tenant, data tidak boleh bercampur.

**Status demo:** Fase 1–4 di bawah ini yang membuat app siap dipakai demo langganan.

Disepakati 4 Sep 2026:

| Paket | Transaksi / bulan | Max outlet | Harga bulanan | Harga tahunan |
|---|---|---|---|---|
| FREE | 50 | 1 | Rp 0 | Rp 0 |
| PRO | Unlimited | 1 | Rp 99.000 | Rp 990.000 |
| BUSINESS | Unlimited | 3 | Rp 249.000 | Rp 2.490.000 |

- Payment fase 1: QRIS / transfer + upload bukti, **admin platform** approve manual.
- Midtrans = fase 2 (belum dikerjakan).
- Tidak ada trial berwaktu, tidak ada cancel.
- Transaksi yang dihitung di FREE: POS + B2B + Proses + Output + Pembelian + Pengeluaran, per bulan kalender WIB.

---

## Yang TIDAK dikerjakan (sengaja)

| Item checklist lama | Alasan |
|---|---|
| Folder `packages/saas` / turborepo | App ini satu Next.js, bukan monorepo |
| `outletId` di semua tabel transaksi | Sudah ada di POS/B2B/Produksi/Pembelian |
| `paymentProofUrl` di Order POS/B2B | Itu bukti bayar **langganan**, bukan order pelanggan |

---

## Checklist berurutan

### A. Pondasi tenant (wajib sebelum langganan)

- [x] Backup (dilakukan user)
- [x] Model `Tenant` + `PembayaranLangganan`
- [x] `tenantId` di semua data bisnis
- [x] Isolasi query (Prisma extension + AsyncLocalStorage)
- [x] Register UMKM → tenant FREE + outlet + owner
- [x] Role `PLATFORM_ADMIN` (Rizky) terpisah dari Owner toko

### B. Limit paket

- [x] FREE max 50 transaksi / bulan
- [x] FREE/PRO max 1 outlet, BUSINESS max 3
- [x] Badge paket di sidebar + halaman Langganan

### C. Payment manual + approval

- [x] Halaman Langganan (pilih PRO/BUSINESS, upload bukti)
- [x] Admin platform: daftar tenant + approve/tolak
- [x] Audit log saat approve
- [x] Landing + pricing

### D. Demo & deploy

- [x] Seed: `superadmin` (platform) + `admin` (tenant 1) + `demo2` (tenant 2)
- [x] Update `.env.example` + `DEPLOY_EASYPANEL.md`
- [x] Test 2 tenant tidak saling lihat data (`src/lib/tenant.test.ts`)
- [x] Test FREE mentok di 50 (`src/lib/subscription.test.ts`)
- [x] Test approve pembayaran → paidUntil (`src/lib/subscription.test.ts`)
- [x] Banner kuota FREE + toast Upgrade saat limit
- [ ] Deploy staging EasyPanel — **kamu yang klik Deploy** (lihat `DEPLOY_EASYPANEL.md`)

### E. Fase 2 — Midtrans + perpanjang

- [x] Snap Midtrans (kalau key diisi) — manual tetap jalan
- [x] Webhook `/api/subscription/midtrans/notification` aktifkan paket otomatis
- [x] Perpanjang: masa aktif dihitung dari sisa `paidUntil`
- [x] Banner 7 hari sebelum habis

---

## Akun seed

| Username | Password | Peran |
|---|---|---|
| `superadmin` | `admin123` (atau `SEED_ADMIN_PASSWORD`) | Platform admin — approve langganan |
| `admin` | sama | Owner tenant 1: Gampangin FNB (FREE) |
| `demo2` | sama | Owner tenant 2: Dapur Sebelah (FREE) — untuk tes isolasi |

Ganti password setelah login pertama.
