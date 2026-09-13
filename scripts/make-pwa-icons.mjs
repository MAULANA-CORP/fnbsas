import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size, r, g, b) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const i = y * (size * 3 + 1) + 1 + x * 3;
      const cx = x - size / 2;
      const cy = y - size / 2;
      const inMark = cx * cx + (cy + size * 0.08) * (cy + size * 0.08) < (size * 0.18) ** 2;
      raw[i] = inMark ? 234 : r;
      raw[i + 1] = inMark ? 88 : g;
      raw[i + 2] = inMark ? 12 : b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync("public/icons", { recursive: true });
const navy = png(192, 10, 11, 15);
const big = png(512, 10, 11, 15);
writeFileSync("public/icons/icon-192.png", navy);
writeFileSync("public/icons/icon-512.png", big);
writeFileSync("public/icon.png", big);
console.log("PWA PNG written", createHash("sha1").update(navy).digest("hex"));
