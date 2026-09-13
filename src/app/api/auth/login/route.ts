import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { runWithoutTenant } from "@/lib/tenant";
import { kenaRateLimit, resetRateLimit } from "@/lib/rate-limit";

const MAKS = 5;
const JENDELA = 15 * 60 * 1000;
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuC5rQeH3qV0e8y1b2c3d4e5f6g7h8i9e";

export async function POST(req: Request) {
  return runWithoutTenant(() => loginPost(req));
}

async function loginPost(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const key = `login:${ip}`;

  if (await kenaRateLimit(key, MAKS, JENDELA)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi 15 menit lagi." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const username = String(body?.username ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const slug = String(body?.slug ?? "").trim().toLowerCase();

  if (!username || !password) {
    return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
  }

  const candidates = await getPrisma().user.findMany({
    where: { username, isActive: true },
    include: { tenant: { select: { slug: true, isSuspended: true } } },
  });

  const gagal = NextResponse.json({ error: "Username atau password salah" }, { status: 401 });

  let user: (typeof candidates)[number] | null = candidates[0] ?? null;
  if (candidates.length > 1) {
    if (!slug) {
      return NextResponse.json(
        { error: "Username dipakai di lebih dari satu toko. Isi kode toko (slug).", type: "slug_required" },
        { status: 400 }
      );
    }
    user = candidates.find((c) => c.tenant?.slug === slug) ?? null;
  }

  if (!user?.passwordHash) {
    await bcrypt.compare(password, DUMMY_HASH);
    return gagal;
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) return gagal;

  if (user.tenantId && user.role !== "PLATFORM_ADMIN") {
    if (user.tenant?.isSuspended) {
      return NextResponse.json(
        { error: "Toko dinonaktifkan. Hubungi admin Gampangin." },
        { status: 403 }
      );
    }
  }

  const session = await getSession();
  session.userId = user.id;
  session.nama = user.nama;
  session.isLoggedIn = true;
  await session.save();

  await getPrisma().user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await resetRateLimit(key);
  return NextResponse.json({
    ok: true,
    nama: user.nama,
    role: user.role,
    tenantId: user.tenantId,
  });
}
