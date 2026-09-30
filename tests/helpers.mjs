import { loadFonts } from '../src/typography.mjs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

export async function loadTestFonts() {
  return loadFonts({
    regular: new URL('../vendor/fonts/NotoSans-Regular.ttf', import.meta.url),
    bold: new URL('../vendor/fonts/NotoSans-Bold.ttf', import.meta.url),
  });
}

export function decodePng(bytes) {
  const input = Buffer.from(bytes);
  if (!input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error('invalid PNG signature');
  }
  let offset = 8;
  let width;
  let height;
  const data = [];
  while (offset < input.length) {
    if (offset + 12 > input.length) throw new Error('truncated PNG chunk');
    const length = input.readUInt32BE(offset);
    const type = input.toString('ascii', offset + 4, offset + 8);
    const payload = input.subarray(offset + 8, offset + 8 + length);
    if (payload.length !== length) throw new Error('truncated PNG payload');
    if (type === 'IHDR') {
      width = payload.readUInt32BE(0);
      height = payload.readUInt32BE(4);
      if (payload[8] !== 8 || payload[9] !== 6 || payload[12] !== 0) {
        throw new Error('expected non-interlaced 8-bit RGBA PNG');
      }
    }
    if (type === 'IDAT') data.push(payload);
    offset += length + 12;
    if (type === 'IEND') break;
  }
  if (!width || !height || data.length === 0) throw new Error('missing PNG image data');
  const rowBytes = width * 4;
  const inflated = inflateSync(Buffer.concat(data));
  if (inflated.length !== height * (rowBytes + 1)) throw new Error('unexpected PNG data length');
  const rgba = Buffer.alloc(height * rowBytes);
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[y * (rowBytes + 1)];
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = inflated[y * (rowBytes + 1) + 1 + x];
      const left = x >= 4 ? rgba[y * rowBytes + x - 4] : 0;
      const up = y ? rgba[(y - 1) * rowBytes + x] : 0;
      const upperLeft = y && x >= 4 ? rgba[(y - 1) * rowBytes + x - 4] : 0;
      let predictor;
      if (filter === 0) predictor = 0;
      else if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) {
        const estimate = left + up - upperLeft;
        const distances = [left, up, upperLeft].map((value) => Math.abs(estimate - value));
        predictor = distances[0] <= distances[1] && distances[0] <= distances[2]
          ? left : distances[1] <= distances[2] ? up : upperLeft;
      } else throw new Error(`unsupported PNG filter ${filter}`);
      rgba[y * rowBytes + x] = (raw + predictor) & 255;
    }
  }
  return { width, height, rgba };
}

export function pixelAt(image, x, y) {
  return [...image.rgba.subarray((y * image.width + x) * 4, (y * image.width + x + 1) * 4)];
}

export function pngPixelHash(image) {
  const dimensions = Buffer.alloc(8);
  dimensions.writeUInt32BE(image.width, 0);
  dimensions.writeUInt32BE(image.height, 4);
  return createHash('sha256').update(dimensions).update(image.rgba).digest('hex');
}
