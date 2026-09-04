import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { slugifyNamaUsaha } from "@/lib/tenant";

const percobaan = new Map<string, { n: number; sampai: number }>();
const MAKS = 8;
const JENDELA = 15 * 60 * 1000;

function kenaLimit(ip: string) {
  const now = Date.now();
  const rec = percobaan.get(ip);
  if (!rec || now > rec.sampai) {
    percobaan.set(ip, { n: 1, sampai: now + JENDELA });
    return false;
  }
  rec.n += 1;
  return rec.n > MAKS;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (kenaLimit(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan daftar. Coba lagi 15 menit lagi." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const namaUsaha = String(body?.namaUsaha ?? "").trim();
  const namaOwner = String(body?.namaOwner ?? "").trim();
  const username = String(body?.username ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (namaUsaha.length < 3) {
    return NextResponse.json({ error: "Nama usaha minimal 3 karakter" }, { status: 400 });
  }
  if (namaOwner.length < 2) {
    return NextResponse.json({ error: "Nama pemilik wajib diisi" }, { status: 400 });
  }
  if (!/^[a-z0-9._]{3,32}$/.test(username)) {
    return NextResponse.json(
      { error: "Username 3–32 karakter, hanya huruf kecil, angka, titik, underscore" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username sudah dipakai" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = slugifyNamaUsaha(namaUsaha);

  const { tenant, user } = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { namaUsaha, slug, tier: "FREE", status: "ACTIVE" },
    });
    const outlet = await tx.outlet.create({
      data: { tenantId: tenant.id, nama: "Outlet Utama" },
    });
    await tx.pengaturan.create({
      data: { tenantId: tenant.id, namaToko: namaUsaha },
    });
    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        nama: namaOwner,
        username,
        passwordHash,
        role: "OWNER",
        outletId: outlet.id,
      },
    });
    return { tenant, user };
  });

  const session = await getSession();
  session.userId = user.id;
  session.nama = user.nama;
  session.isLoggedIn = true;
  await session.save();

  percobaan.delete(ip);
  return NextResponse.json({
    ok: true,
    nama: user.nama,
    role: user.role,
    tenant: { id: tenant.id, namaUsaha: tenant.namaUsaha, tier: tenant.tier },
  });
}
