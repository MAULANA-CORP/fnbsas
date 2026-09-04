import { describe, expect, it } from "vitest";
import { injectWhere, runWithTenant, tenantCreate, slugifyNamaUsaha, getTenantContext } from "./tenant";

describe("2 tenant tidak saling lihat data", () => {
  it("filter tenant A tidak overlap dengan filter tenant B", () => {
    const whereA = injectWhere({ nama: "Pelanggan Umum" }, "tenant-a");
    const whereB = injectWhere({ nama: "Pelanggan Umum" }, "tenant-b");
    expect(whereA).toEqual({ AND: [{ nama: "Pelanggan Umum" }, { tenantId: "tenant-a" }] });
    expect(whereB).toEqual({ AND: [{ nama: "Pelanggan Umum" }, { tenantId: "tenant-b" }] });
    expect(whereA).not.toEqual(whereB);
  });

  it("where kosong hanya tenantId — tidak menarik baris tenant lain", () => {
    expect(injectWhere({}, "toko-1")).toEqual({ tenantId: "toko-1" });
    expect(injectWhere(undefined, "toko-2")).toEqual({ tenantId: "toko-2" });
  });

  it("create di context tenant A dapat tenantId A, bukan B", () => {
    const rowA = runWithTenant("tenant-a", () => tenantCreate({ nama: "Pelanggan Umum" }));
    const rowB = runWithTenant("tenant-b", () => tenantCreate({ nama: "Pelanggan Umum" }));
    expect(rowA.tenantId).toBe("tenant-a");
    expect(rowB.tenantId).toBe("tenant-b");
    expect(getTenantContext()).toBeUndefined();
  });
});

describe("slug nama usaha", () => {
  it("huruf kecil, strip, dan sufiks acak", () => {
    const slug = slugifyNamaUsaha("Dapur Cabe Merah!");
    expect(slug.startsWith("dapur-cabe-merah-")).toBe(true);
    expect(slug.length).toBeGreaterThan("dapur-cabe-merah-".length);
  });
});
