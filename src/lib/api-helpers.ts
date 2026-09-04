// Pembungkus route handler. Middleware saja tidak cukup — API bisa dipanggil
// langsung tanpa lewat navigasi halaman, jadi setiap handler tetap dijaga.

import { NextResponse } from "next/server";
import { getSession, type Role, type SubscriptionTier } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { runWithTenant } from "@/lib/tenant";
import { SubscriptionError } from "@/lib/subscription";

export interface AuthUser {
  id: string;
  nama: string;
  role: Role;
  outletId: string | null;
  tenantId: string | null;
  tenantNama: string | null;
  tier: SubscriptionTier | null;
  isSuspended: boolean;
}

/** Baca user + role SEGAR dari DB. Jangan pernah percaya role dari cookie. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;

  const user = await getPrisma().user.findFirst({
    where: { id: session.userId, isActive: true },
    select: {
      id: true,
      nama: true,
      role: true,
      outletId: true,
      tenantId: true,
      tenant: { select: { namaUsaha: true, tier: true, paidUntil: true, status: true, isSuspended: true } },
    },
  });
  if (!user) return null;

  let tier: SubscriptionTier | null = user.tenant?.tier ?? null;
  if (user.tenant && tier && tier !== "FREE" && user.tenant.paidUntil && user.tenant.paidUntil < new Date()) {
    tier = "FREE";
  }

  return {
    id: user.id,
    nama: user.nama,
    role: user.role as Role,
    outletId: user.outletId,
    tenantId: user.tenantId,
    tenantNama: user.tenant?.namaUsaha ?? null,
    tier,
    isSuspended: Boolean(user.tenant?.isSuspended),
  };
}

type Handler<T> = (user: AuthUser, req: Request, ctx: T) => Promise<Response> | Response;

function withTenantScope<T>(user: AuthUser, handler: Handler<T>, req: Request, ctx: T) {
  const skipTenant = user.role === "PLATFORM_ADMIN";
  return runWithTenant(skipTenant ? null : user.tenantId, () => handler(user, req, ctx));
}

export function withAuth<T>(handler: Handler<T>) {
  return async (req: Request, ctx: T) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Belum login", type: "auth_required" },
        { status: 401 }
      );
    }
    if (user.isSuspended && user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Toko dinonaktifkan. Hubungi admin Gampangin.", type: "suspended" },
        { status: 403 }
      );
    }
    return withTenantScope(user, handler, req, ctx);
  };
}

export function withRole<T>(roles: Role[], handler: Handler<T>) {
  return async (req: Request, ctx: T) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Belum login", type: "auth_required" },
        { status: 401 }
      );
    }
    if (user.isSuspended && user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Toko dinonaktifkan. Hubungi admin Gampangin.", type: "suspended" },
        { status: 403 }
      );
    }
    if (!roles.includes(user.role)) {
      console.warn(`[auth] Akses ditolak: ${user.id} (role ${user.role})`);
      return NextResponse.json(
        { error: "Anda tidak punya akses untuk tindakan ini.", type: "forbidden" },
        { status: 403 }
      );
    }
    return withTenantScope(user, handler, req, ctx);
  };
}

export const withOwner = <T>(h: Handler<T>) => withRole<T>(["OWNER"], h);
export const withOwnerFinance = <T>(h: Handler<T>) => withRole<T>(["OWNER", "FINANCE"], h);
export const withOwnerSales = <T>(h: Handler<T>) => withRole<T>(["OWNER", "SALES"], h);
export const withOwnerProduksi = <T>(h: Handler<T>) => withRole<T>(["OWNER", "PRODUKSI"], h);
export const withPlatformAdmin = <T>(h: Handler<T>) => withRole<T>(["PLATFORM_ADMIN"], h);

/** Error terstruktur -> respons JSON yang konsisten */
export function apiError(error: unknown) {
  if (error instanceof SubscriptionError) {
    return NextResponse.json(
      { error: error.message, type: "subscription_limit" },
      { status: error.status }
    );
  }
  console.error("[api]", error);
  const pesan = error instanceof Error ? error.message : "Terjadi kesalahan di server";
  return NextResponse.json({ error: pesan, type: "server_error" }, { status: 500 });
}

/** Catat audit log — panggil dari route handler setelah aksi berhasil. */
export async function catatAudit(params: {
  userId: string;
  aksi: string;
  entitas: string;
  entitasId?: string;
  detail?: Record<string, unknown>;
  tenantId?: string | null;
}) {
  await getPrisma().auditLog.create({
    data: {
      userId: params.userId,
      aksi: params.aksi,
      entitas: params.entitas,
      entitasId: params.entitasId,
      tenantId: params.tenantId === undefined ? undefined : params.tenantId,
      detail: params.detail as import("@/generated/prisma/client").Prisma.InputJsonValue | undefined,
    },
  });
}
