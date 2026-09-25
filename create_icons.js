const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, bgColor, accentColor) {
  // Create uncompressed raw RGBA pixels
  const rowBytes = width * 4 + 1; // +1 for filter byte
  const buffer = Buffer.alloc(rowBytes * height);

  // Hex colors
  const bgR = parseInt(bgColor.slice(1, 3), 16);
  const bgG = parseInt(bgColor.slice(3, 5), 16);
  const bgB = parseInt(bgColor.slice(5, 7), 16);

  const accR = parseInt(accentColor.slice(1, 3), 16);
  const accG = parseInt(accentColor.slice(3, 5), 16);
  const accB = parseInt(accentColor.slice(5, 7), 16);

  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = width * 0.4;
  const innerRadius = width * 0.25;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    buffer[rowOffset] = 0; // Filter: none

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Draw stylish circle icon
      let r = bgR, g = bgG, b = bgB, a = 255;
      if (dist <= outerRadius) {
        if (dist >= innerRadius) {
          r = accR; g = accG; b = accB;
        } else {
          r = 255; g = 255; b = 255;
        }
      }

      buffer[pxOffset] = r;
      buffer[pxOffset + 1] = g;
      buffer[pxOffset + 2] = b;
      buffer[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(buffer);

  // Build PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);

  const crcBuf = buf.slice(4, 8 + len);
  const crc = crc32(crcBuf);
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 table & function
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1);
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// Create 192x192, 512x512 and 180x180 PNGs
fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), createPNG(192, 192, '#09090b', '#10b981'));
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), createPNG(512, 512, '#09090b', '#10b981'));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, '#09090b', '#10b981'));

console.log('PNG Icons successfully created in /public!');
