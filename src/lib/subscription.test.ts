import { describe, expect, it } from "vitest";
import {
  HARGA_LANGGANAN,
  TIER_LIMIT,
  evaluasiKuota,
  hitungPaidUntil,
  hitungPerpanjangan,
  pesanLimitTransaksi,
  awalBulanWIB,
  awalBulanBerikutnyaWIB,
} from "./subscription";

describe("paket langganan", () => {
  it("FREE 50 transaksi / 1 outlet, PRO unlimited 1 outlet, BUSINESS 3 outlet", () => {
    expect(TIER_LIMIT.FREE.maxTransaksiBulan).toBe(50);
    expect(TIER_LIMIT.FREE.maxOutlet).toBe(1);
    expect(TIER_LIMIT.PRO.maxTransaksiBulan).toBe(Infinity);
    expect(TIER_LIMIT.PRO.maxOutlet).toBe(1);
    expect(TIER_LIMIT.BUSINESS.maxOutlet).toBe(3);
  });

  it("harga PRO/BUSINESS sesuai kesepakatan", () => {
    expect(HARGA_LANGGANAN.PRO.BULANAN).toBe(99_000);
    expect(HARGA_LANGGANAN.PRO.TAHUNAN).toBe(990_000);
    expect(HARGA_LANGGANAN.BUSINESS.BULANAN).toBe(249_000);
    expect(HARGA_LANGGANAN.BUSINESS.TAHUNAN).toBe(2_490_000);
  });
});

describe("FREE mentok di 50 transaksi", () => {
  it("masih boleh di transaksi ke-50 (terpakai 49)", () => {
    expect(evaluasiKuota(49, 50)).toEqual({ boleh: true, sisa: 1 });
  });

  it("ditolak mulai transaksi ke-51 (terpakai 50)", () => {
    const hasil = evaluasiKuota(50, 50);
    expect(hasil.boleh).toBe(false);
    expect(hasil.sisa).toBe(0);
    expect(pesanLimitTransaksi(50)).toMatch(/50 transaksi/);
    expect(pesanLimitTransaksi(50)).toMatch(/Upgrade ke PRO/);
  });

  it("PRO/BUSINESS unlimited tidak ditolak", () => {
    expect(evaluasiKuota(10_000, null)).toEqual({ boleh: true, sisa: null });
  });
});

describe("approve pembayaran → paidUntil", () => {
  it("BULANAN menambah 1 bulan", () => {
    const from = new Date("2026-01-15T00:00:00+07:00");
    const until = hitungPaidUntil("BULANAN", from);
    expect(until.getMonth()).toBe(from.getMonth() + 1);
    expect(until.getFullYear()).toBe(2026);
  });

  it("TAHUNAN menambah 1 tahun", () => {
    const from = new Date("2026-09-04T00:00:00+07:00");
    const until = hitungPaidUntil("TAHUNAN", from);
    expect(until.getFullYear()).toBe(2027);
  });
});

describe("perpanjang sendiri", () => {
  it("kalau paket masih aktif, dihitung dari paidUntil bukan dari hari ini", () => {
    const now = new Date("2026-09-04T00:00:00+07:00");
    const sisa = new Date("2026-10-04T00:00:00+07:00");
    const hasil = hitungPerpanjangan("BULANAN", sisa, now);
    expect(hasil.getTime()).toBe(hitungPaidUntil("BULANAN", sisa).getTime());
    expect(hasil.getTime()).toBeGreaterThan(hitungPaidUntil("BULANAN", now).getTime());
  });

  it("kalau sudah habis, dihitung dari sekarang", () => {
    const now = new Date("2026-09-04T00:00:00+07:00");
    const habis = new Date("2026-08-01T00:00:00+07:00");
    const hasil = hitungPerpanjangan("BULANAN", habis, now);
    expect(hasil.getTime()).toBe(hitungPaidUntil("BULANAN", now).getTime());
  });
});

describe("periode WIB", () => {
  it("awal bulan berikutnya setelah akhir bulan ini", () => {
    const d = new Date("2026-09-04T10:00:00+07:00");
    const start = awalBulanWIB(d);
    const next = awalBulanBerikutnyaWIB(d);
    expect(start.toISOString()).toBe(new Date("2026-09-01T00:00:00+07:00").toISOString());
    expect(next.toISOString()).toBe(new Date("2026-10-01T00:00:00+07:00").toISOString());
    expect(next.getTime()).toBeGreaterThan(start.getTime());
  });
});
