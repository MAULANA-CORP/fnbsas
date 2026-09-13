import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { runWithoutTenant } from "@/lib/tenant";

export async function GET() {
  try {
    await runWithoutTenant(() => getPrisma().$queryRaw`SELECT 1`);
    return NextResponse.json({ ok: true, db: "ok" });
  } catch {
    return NextResponse.json({ ok: false, db: "error" }, { status: 503 });
  }
}
