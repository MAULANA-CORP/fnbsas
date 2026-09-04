# Deploy Gampangin FNB ke EasyPanel

Repo sudah di GitHub: `https://github.com/MAULANA-CORP/fnbsas.git` (branch `main`).
**Tidak ada folder `prisma/migrations`** — schema di-sync pakai `prisma db push`, bukan `migrate deploy`.

## 1. PostgreSQL

EasyPanel → **New Service** → **PostgreSQL**.

Catat (dari tab Credentials / Connection):

- host **internal** (nama service, bukan IP publik)
- port (biasanya `5432`)
- user, password, nama database

Jadikan:

```
postgresql://USER:PASSWORD@HOST_INTERNAL:5432/NAMA_DB
```

Kalau password ada `@ : / # ?` encode dulu (contoh `@` → `%40`).

## 2. App

**New Service** → **App**

| Setting | Isi |
|---|---|
| Source | GitHub `MAULANA-CORP/fnbsas` branch `main` |
| Build Method | **Dockerfile** |
| Port | **3000** |
| Command | jangan diisi (pakai `node server.js` dari Dockerfile) |

**Volume (wajib):**

- Host path: volume baru, mis. `fnbsas-uploads`
- Container path: `/app/public/uploads`

## 3. Environment

Isi di EasyPanel **sebelum** Deploy pertama:

```
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
DATABASE_URL=postgresql://USER:PASSWORD@HOST_INTERNAL:5432/NAMA_DB
SESSION_SECRET=ganti_dengan_string_acak_minimal_32_karakter
SESSION_COOKIE_NAME=gampangin_fnb_session
SEED_ADMIN_PASSWORD=password-kuat-buat-login-pertama
```

Opsional (boleh kosong dulu):

```
SAAS_BANK_NAME=BCA
SAAS_BANK_ACCOUNT=
SAAS_BANK_HOLDER=
SAAS_QRIS_IMAGE_URL=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
```

Rekening juga bisa diisi nanti dari `/admin` → **Rekening**.

Generate `SESSION_SECRET` (di laptop):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Deploy

Klik **Deploy**. Tunggu build Dockerfile selesai (bisa beberapa menit).

Kalau gagal: buka log build. Yang sering: `DATABASE_URL` belum diisi, atau GitHub repo tidak terhubung.

## 5. Schema + seed (sekali, setelah container hijau)

Buka **Terminal / Console** service App:

```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

Kalau `npx prisma` **not found** (image production slim):

1. Di laptop, sementara buka PostgreSQL EasyPanel ke publik / pakai connection yang bisa diakses
2. Dari folder `fnbsas` lokal:

```bash
npx prisma db push
npm run db:seed
```

dengan `DATABASE_URL` mengarah ke DB server (bukan localhost).

Setelah tabel + seed masuk, tutup akses publik DB kalau sempat dibuka.

## 6. Domain

EasyPanel → service App → **Domains** → `fnb.gampangin.biz.id` (atau domain kamu) → port **3000** → HTTPS.

Webhook Midtrans (kalau key sudah diisi):

`https://DOMAIN-KAMU/api/subscription/midtrans/notification`

## 7. Cek login

| Username | Fungsi |
|---|---|
| `admin` | Owner toko demo Gampangin FNB |
| `demo2` | Owner toko kedua (isolasi data) |
| `superadmin` | Admin platform → `/admin` |

Password = nilai `SEED_ADMIN_PASSWORD`. **Ganti setelah masuk.**

Cek: landing `/` kebuka, `/admin` ringkasan kebuka, upload bukti di `/langganan` tidak 500.

## Update berikutnya

Push ke `main` → EasyPanel → **Deploy**.

Kalau ada perubahan `schema.prisma`, jalankan lagi `npx prisma db push` (bukan migrate deploy).

## Kalau bermasalah

| Gejala | Cek |
|---|---|
| App crash / 500 | `DATABASE_URL` host internal? `SESSION_SECRET` ≥ 32 karakter? |
| Login gagal terus | Seed sudah jalan? Username/password seed? |
| Build gagal Prisma | Biarkan `DATABASE_URL` palsu di Dockerfile untuk generate |
| Bukti transfer hilang setelah redeploy | Volume `/app/public/uploads` belum di-mount |
| `npx prisma` tidak ada di container | Push schema dari laptop ke DB EasyPanel (langkah 5) |
