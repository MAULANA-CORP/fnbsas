-- Sisa audit: tutup buku, rate limit, POS BATAL, stok per outlet, username per toko.

DO $$ BEGIN
  CREATE TYPE "StatusOrderPOS" AS ENUM ('AKTIF', 'BATAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "order_pos" ADD COLUMN IF NOT EXISTS "status" "StatusOrderPOS" NOT NULL DEFAULT 'AKTIF';
CREATE INDEX IF NOT EXISTS "order_pos_status_idx" ON "order_pos"("status");

ALTER TABLE "stok_movement_bahan_baku" ADD COLUMN IF NOT EXISTS "outletId" TEXT;
CREATE INDEX IF NOT EXISTS "stok_movement_bahan_baku_outletId_idx" ON "stok_movement_bahan_baku"("outletId");

ALTER TABLE "stok_movement_kemasan" ADD COLUMN IF NOT EXISTS "outletId" TEXT;
CREATE INDEX IF NOT EXISTS "stok_movement_kemasan_outletId_idx" ON "stok_movement_kemasan"("outletId");

ALTER TABLE "stok_movement_produk_jadi" ADD COLUMN IF NOT EXISTS "outletId" TEXT;
CREATE INDEX IF NOT EXISTS "stok_movement_produk_jadi_outletId_idx" ON "stok_movement_produk_jadi"("outletId");

ALTER TABLE "kemasan" ADD COLUMN IF NOT EXISTS "hargaRataRata" DECIMAL(15,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "tutup_buku" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "saldoSistem" DECIMAL(15,2) NOT NULL,
    "aktualKas" DECIMAL(15,2) NOT NULL,
    "selisih" DECIMAL(15,2) NOT NULL,
    "catatan" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tutup_buku_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "tutup_buku_tenantId_tanggal_idx" ON "tutup_buku"("tenantId", "tanggal");

CREATE TABLE IF NOT EXISTS "rate_limits" (
    "key" TEXT NOT NULL,
    "n" INTEGER NOT NULL,
    "sampai" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "tutup_buku" DROP CONSTRAINT IF EXISTS "tutup_buku_tenantId_fkey";
ALTER TABLE "tutup_buku" ADD CONSTRAINT "tutup_buku_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tutup_buku" DROP CONSTRAINT IF EXISTS "tutup_buku_userId_fkey";
ALTER TABLE "tutup_buku" ADD CONSTRAINT "tutup_buku_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "users_username_key";
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenantId_username_key" ON "users"("tenantId", "username");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");
