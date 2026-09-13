import { describe, expect, it } from "vitest";
import { MIN_PASSWORD, validasiPassword } from "./password";

describe("validasiPassword", () => {
  it(`tolak di bawah ${MIN_PASSWORD} karakter`, () => {
    expect(validasiPassword("1234567")).toBeTruthy();
  });
  it("terima 8 karakter", () => {
    expect(validasiPassword("12345678")).toBeNull();
  });
});
