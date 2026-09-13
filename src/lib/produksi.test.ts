import { describe, expect, it } from "vitest";
import { hitungAlokasiHPP } from "./produksi";

describe("hitungAlokasiHPP", () => {
  it("waste masuk ke biaya bahan baku", () => {
    const hasil = hitungAlokasiHPP(
      [{ bahanBakuId: "a", qtyPakai: 1, qtyWaste: 0.2, hargaSatuanSaatItu: 10000 }],
      [],
      [{ produkJadiId: "p", qty: 10, beratBersih: 100 }],
      0
    );
    expect(hasil.totalBiayaBahanBaku).toBe(12000);
    expect(hasil.totalBiayaBatch).toBe(12000);
  });

  it("alokasi proporsional berat", () => {
    const hasil = hitungAlokasiHPP(
      [{ bahanBakuId: "a", qtyPakai: 1, hargaSatuanSaatItu: 1000 }],
      [],
      [
        { produkJadiId: "p1", qty: 1, beratBersih: 100 },
        { produkJadiId: "p2", qty: 1, beratBersih: 300 },
      ],
      0
    );
    expect(hasil.output[0].hppAlokasi).toBe(250);
    expect(hasil.output[1].hppAlokasi).toBe(750);
  });
});
