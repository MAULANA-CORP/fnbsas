// jalankan: npm run db:seed — idempoten, aman dijalankan berkali-kali.

import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function seedTenant(opts: {
  slug: string;
  namaUsaha: string;
  outletId: string;
  outletNama: string;
  username: string;
  namaOwner: string;
  passwordHash: string;
  customerNama: string;
}) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: opts.slug },
    update: {},
    create: {
      namaUsaha: opts.namaUsaha,
      slug: opts.slug,
      tier: "FREE",
      status: "ACTIVE",
    },
  });

  const outlet = await prisma.outlet.upsert({
    where: { id: opts.outletId },
    update: { tenantId: tenant.id, nama: opts.outletNama },
    create: { id: opts.outletId, tenantId: tenant.id, nama: opts.outletNama },
  });

  const owner = await prisma.user.upsert({
    where: { username: opts.username },
    update: { tenantId: tenant.id, outletId: outlet.id, role: "OWNER" },
    create: {
      nama: opts.namaOwner,
      username: opts.username,
      passwordHash: opts.passwordHash,
      role: "OWNER",
      tenantId: tenant.id,
      outletId: outlet.id,
    },
  });

  await prisma.pengaturan.upsert({
    where: { tenantId: tenant.id },
    update: { namaToko: opts.namaUsaha },
    create: { tenantId: tenant.id, namaToko: opts.namaUsaha },
  });

  const existingCustomer = await prisma.customer.findFirst({
    where: { tenantId: tenant.id, nama: opts.customerNama },
  });
  if (!existingCustomer) {
    await prisma.customer.create({
      data: { tenantId: tenant.id, nama: opts.customerNama, kontak: "-" },
    });
  }

  return { tenant, owner };
}

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  const demo = await seedTenant({
    slug: "gampangin-demo",
    namaUsaha: "Gampangin FNB",
    outletId: "outlet-utama",
    outletNama: "Outlet Utama",
    username: "admin",
    namaOwner: "Owner Demo",
    passwordHash,
    customerNama: "Pelanggan Umum",
  });

  const lain = await seedTenant({
    slug: "dapur-sebelah",
    namaUsaha: "Dapur Sebelah",
    outletId: "outlet-demo2",
    outletNama: "Dapur Utama",
    username: "demo2",
    namaOwner: "Owner Dapur Sebelah",
    passwordHash,
    customerNama: "Pelanggan Umum",
  });

  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: { role: "PLATFORM_ADMIN", tenantId: null },
    create: {
      nama: "Platform Admin",
      username: "superadmin",
      passwordHash,
      role: "PLATFORM_ADMIN",
      tenantId: null,
    },
  });

  await prisma.voucher.upsert({
    where: { kode: "TEMAN50" },
    update: { isActive: true, tipe: "PERSEN", nilai: 50, berlakuUntuk: "PRO" },
    create: {
      kode: "TEMAN50",
      tipe: "PERSEN",
      nilai: 50,
      berlakuUntuk: "PRO",
      maxPakai: 50,
      satuPerToko: true,
      catatan: "Diskon 50% PRO untuk teman",
    },
  });
  await prisma.voucher.upsert({
    where: { kode: "TEMAN20RB" },
    update: { isActive: true, tipe: "NOMINAL", nilai: 20_000, berlakuUntuk: "PRO" },
    create: {
      kode: "TEMAN20RB",
      tipe: "NOMINAL",
      nilai: 20_000,
      berlakuUntuk: "PRO",
      maxPakai: 50,
      satuPerToko: true,
      catatan: "Potong Rp 20.000 untuk PRO",
    },
  });

  console.log(`Tenant 1: ${demo.tenant.namaUsaha} — login admin`);
  console.log(`Tenant 2: ${lain.tenant.namaUsaha} — login demo2`);
  console.log("Platform admin: superadmin");
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("Password default semua akun: admin123 — ganti setelah login pertama.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
