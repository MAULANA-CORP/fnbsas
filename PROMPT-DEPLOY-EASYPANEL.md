# Prompt — Deploy Gampangin FNB ke EasyPanel

Copy semua teks di bawah ini, tempel ke AI agent (Antigravity / Kilo / Roo / Claude Code). Jangan potong.

---

```
Kamu adalah agent yang men-deploy aplikasi yang SUDAH JADI ke EasyPanel. Bukan bikin ulang. Bukan ubah fitur.

STEP 1 selalu: Folder sudah di-extract / sudah di-clone manual oleh user. JANGAN extract ZIP. JANGAN inisialisasi project baru. Langsung:

cd "G:\REPO\1- GAMPANGIN\fnbsas"
npm install

Kalau path beda, tanya user. Jangan tebak.

============================================================
TUJUAN
============================================================

Deploy app SaaS F&B ini ke EasyPanel "biasa" (App + PostgreSQL, Build Method Dockerfile, port 3000) sampai:

1. Build image sukses
2. App merespons di domain/port
3. Schema Prisma masuk PostgreSQL
4. Seed jalan
5. Login admin / superadmin berhasil
6. Upload bukti transfer persist (volume)

Jangan ubah logika bisnis, schema, UI, atau stack kecuali diperlukan supaya deploy jalan.

============================================================
STACK — JANGAN DIGANTI
============================================================

Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · Prisma 7 + @prisma/adapter-pg · PostgreSQL · iron-session · output: "standalone" (lihat next.config.mjs)

Auth: username + password, cookie iron-session. Bukan NextAuth.

Prisma client di-generate ke `src/generated/prisma` (bukan default node_modules/.prisma saja). Baca `prisma/schema.prisma` + `prisma.config.ts` (Prisma 7, butuh DATABASE_URL saat generate/push).

============================================================
FAKTA PENTING REPO INI
============================================================

- Ada `Dockerfile` dan `DEPLOY_EASYPANEL.md`. Baca dulu.
- **TIDAK ADA folder `prisma/migrations`.** Jadi JANGAN `prisma migrate deploy` untuk first deploy. Pakai:
  npx prisma db push
  npm run db:seed
- Seed idempotent (`prisma/seed.ts`): upsert tenant + user.
- Image production = Next standalone (`CMD ["node", "server.js"]`). Container runner **mungkin tidak punya** Prisma CLI / tsx. Kalau `npx prisma` gagal di terminal EasyPanel, PERBAIKI Dockerfile runner supaya bisa db push + seed (copy prisma CLI, tsx, schema, generated client) — jangan minta user SSH asal-asalan tanpa solusi.
- Volume wajib: `public/uploads` (bukti transfer langganan). Dockerfile sudah `mkdir -p /app/public/uploads/bukti`.
- `.env` jangan pernah di-commit. Hanya `.env.example`.
- Multi-tenant: banyak toko, 1 toko banyak user. Username unik GLOBAL.

============================================================
YANG HARUS DITANYA KE USER KALAU BELUM ADA
============================================================

Jangan mengarang. Tanya sekali, batch:

1. URL repo GitHub (atau EasyPanel pull dari folder/server mana)
2. Domain (contoh di docs: fnb.gampangin.biz.id) — sudah diarahkan ke EasyPanel belum
3. Credential EasyPanel / apakah user yang klik UI, kamu hanya siapkan file + perintah
4. SESSION_SECRET produksi (min 32 karakter) — generate kalau user bilang "buatkan"
5. Rekening: SAAS_BANK_NAME / ACCOUNT / HOLDER (boleh isi default dulu, user ganti di /admin → Rekening)
6. Midtrans: opsional. Kalau belum ada key, kosongkan. App tetap jalan (bayar manual).
7. SEED_ADMIN_PASSWORD — default admin123, ingatkan ganti setelah login

============================================================
LANGKAH DEPLOY (URUT)
============================================================

A. Pastikan git bersih dari rahasia
- `.env` di .gitignore
- Jangan commit node_modules, .next, src/generated

B. EasyPanel → PostgreSQL
- Service PostgreSQL baru
- DATABASE_URL pakai **host internal** EasyPanel, bukan IP publik
- Format: postgresql://USER:PASSWORD@HOST_INTERNAL:5432/NAMA_DB
- Password URL-encode kalau ada karakter spesial

C. EasyPanel → App
- Source: GitHub repo ini
- Build Method: **Dockerfile**
- Port: **3000**
- Command default: dari Dockerfile (`node server.js`) — jangan `npm run dev`
- Volume: mount persistent ke `/app/public/uploads`

D. Environment (wajib)

NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
DATABASE_URL=postgresql://...host-internal...
SESSION_SECRET=<minimal 32 karakter, random>
SESSION_COOKIE_NAME=gampangin_fnb_session
SEED_ADMIN_PASSWORD=<password kuat, jangan admin123 di produksi>

Opsional:
SAAS_BANK_NAME=
SAAS_BANK_ACCOUNT=
SAAS_BANK_HOLDER=
SAAS_QRIS_IMAGE_URL=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=true   (hanya kalau key production sudah ada; sandbox = false)

E. Build
- Deploy
- Kalau build gagal prisma generate: Dockerfile sudah set DATABASE_URL palsu untuk generate. Jangan hapus itu.
- Kalau Prisma 7 / output generated tidak ketemu di runtime: perbaiki COPY di stage runner (ikutkan `src/generated/prisma` kalau tidak ke-bundle standalone). Verifikasi `npm run build` lokal dulu.

F. Schema + seed (sekali)
Setelah container healthy, dari environment yang PUNYA prisma CLI (bukan tebak):

export DATABASE_URL="(sama persis dengan EasyPanel)"
npx prisma generate
npx prisma db push
npm run db:seed

Kalau hanya bisa exec di container production dan prisma tidak ada: tambahkan stage/script entrypoint first-boot, atau copy binary prisma+tsx ke runner, lalu jalankan perintah di atas. Jangan `migrate deploy`.

G. Domain
- EasyPanel Domains → domain user → port 3000
- HTTPS on

H. Midtrans (hanya kalau key diisi)
Webhook: https://DOMAIN/api/subscription/midtrans/notification
Path ini public (tanpa cookie).

============================================================
VERIFIKASI (WAJIB SEBELUM BILANG SELESAI)
============================================================

- [ ] `curl -I https://DOMAIN` atau http://SERVER:PORT → 200 (landing)
- [ ] Login `admin` / password seed → dashboard toko
- [ ] Login `demo2` / password seed → toko lain, data tidak ketemu dengan admin
- [ ] Login `superadmin` / password seed → /admin (Ringkasan, Pembayaran, Tenant, Voucher, Rekening)
- [ ] Upload bukti di /langganan tidak error 500; file ada di volume
- [ ] Restart container: data DB tetap, file upload tetap
- [ ] Yang belum beres ditulis terbuka (contoh: Midtrans kosong, domain belum SSL)

Akun seed (kalau SEED_ADMIN_PASSWORD tidak di-override):
- admin / admin123 → Owner tenant "Gampangin FNB" (FREE)
- demo2 / admin123 → Owner tenant "Dapur Sebelah"
- superadmin / admin123 → Platform admin
Ingatkan user GANTI PASSWORD setelah login pertama.

============================================================
JANGAN
============================================================

- Jangan rewrite app, ganti ORM, ganti auth, ganti ke Vercel-only
- Jangan `prisma migrate deploy` (tidak ada migrations)
- Jangan pakai DATABASE_URL localhost di server
- Jangan commit .env
- Jangan hapus output: "standalone"
- Jangan anggap selesai kalau baru "build sukses" tanpa login test

Kalau EasyPanel UI harus diklik manusia (hubungkan GitHub, isi env, pasang domain): tulis checklist klik yang jelas, jangan pura-pura sudah klik.
```
