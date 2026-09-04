import { describe, expect, it } from "vitest";
import { signatureMidtrans, statusMidtransGagal, statusMidtransLunas } from "./midtrans";

describe("Midtrans signature", () => {
  it("SHA512(order_id + status_code + gross_amount + server_key)", () => {
    const sig = signatureMidtrans("SUB-1", "200", "99000.00", "SB-Mid-server-test");
    expect(sig).toHaveLength(128);
    expect(signatureMidtrans("SUB-1", "200", "99000.00", "SB-Mid-server-test")).toBe(sig);
    expect(signatureMidtrans("SUB-2", "200", "99000.00", "SB-Mid-server-test")).not.toBe(sig);
  });
});

describe("status Midtrans", () => {
  it("settlement dan capture accept = lunas", () => {
    expect(statusMidtransLunas("settlement")).toBe(true);
    expect(statusMidtransLunas("capture", "accept")).toBe(true);
    expect(statusMidtransLunas("pending")).toBe(false);
  });

  it("deny/cancel/expire = gagal", () => {
    expect(statusMidtransGagal("expire")).toBe(true);
    expect(statusMidtransGagal("settlement")).toBe(false);
  });
});
