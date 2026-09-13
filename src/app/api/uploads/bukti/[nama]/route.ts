import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-helpers";
import { runWithTenant, runWithoutTenant } from "@/lib/tenant";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function namaAman(nama: string) {
  return /^[a-zA-Z0-9._-]+$/.test(nama);
}

async function bacaBukti(nama: string) {
  const dir = path.join(process.cwd(), "public", "uploads", "bukti");
  const filePath = path.join(dir, nama);
  if (!filePath.startsWith(dir)) {
    throw new Error("Path tidak valid");
  }
  return readFile(filePath);
}

export const GET = async (_req: Request, ctx: { params: Promise<{ nama: string }> }) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login", type: "auth_required" }, { status: 401 });
  }

  const { nama } = await ctx.params;
  if (!namaAman(nama)) {
    return NextResponse.json({ error: "Nama file tidak valid" }, { status: 400 });
  }

  if (user.role !== "PLATFORM_ADMIN") {
    if (!user.tenantId || !nama.startsWith(`${user.tenantId}-`)) {
      return NextResponse.json({ error: "Bukti tidak ditemukan" }, { status: 404 });
    }
  }

  try {
    const buf = user.role === "PLATFORM_ADMIN"
      ? await runWithoutTenant(() => bacaBukti(nama))
      : await runWithTenant(user.tenantId!, () => bacaBukti(nama));
    const ext = path.extname(nama).toLowerCase();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Bukti tidak ditemukan" }, { status: 404 });
  }
};
