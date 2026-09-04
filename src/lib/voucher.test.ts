import { describe, expect, it } from "vitest";
import { hitungDiskonVoucher, normalisasiKode } from "./voucher";

describe("diskon voucher", () => {
  it("persen memotong harga PRO bulanan", () => {
    expect(hitungDiskonVoucher({ harga: 99_000, tipe: "PERSEN", nilai: 50 })).toEqual({
      harga: 99_000,
      diskon: 49_500,
      bayar: 49_500,
    });
  });

  it("nominal Rp tidak boleh melebihi harga", () => {
    expect(hitungDiskonVoucher({ harga: 99_000, tipe: "NOMINAL", nilai: 20_000 }).bayar).toBe(79_000);
    expect(hitungDiskonVoucher({ harga: 99_000, tipe: "NOMINAL", nilai: 200_000 }).bayar).toBe(0);
  });

  it("100% jadi gratis", () => {
    expect(hitungDiskonVoucher({ harga: 99_000, tipe: "PERSEN", nilai: 100 }).bayar).toBe(0);
  });
});

describe("kode voucher", () => {
  it("huruf besar tanpa spasi/simbol", () => {
    expect(normalisasiKode(" teman-50 ")).toBe("TEMAN50");
  });
});
