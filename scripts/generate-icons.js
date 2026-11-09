const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = path.join(__dirname, '..');

// Generate SVG Icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.25" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)" />
  
  <g filter="url(#shadow)">
    <rect x="110" y="80" width="310" height="352" rx="24" fill="#FFFFFF" />
    <rect x="110" y="80" width="48" height="352" rx="12" fill="#E2E8F0" />
    <circle cx="134" cy="120" r="10" fill="#047857" />
    <circle cx="134" cy="170" r="10" fill="#047857" />
    <circle cx="134" cy="220" r="10" fill="#047857" />
    <circle cx="134" cy="270" r="10" fill="#047857" />
    <circle cx="134" cy="320" r="10" fill="#047857" />
    <circle cx="134" cy="370" r="10" fill="#047857" />
    <circle cx="134" cy="400" r="6" fill="#047857" />

    <line x1="180" y1="140" x2="390" y2="140" stroke="#CBD5E1" stroke-width="6" stroke-linecap="round" />
    <line x1="180" y1="190" x2="390" y2="190" stroke="#CBD5E1" stroke-width="6" stroke-linecap="round" />
    <line x1="180" y1="240" x2="390" y2="240" stroke="#CBD5E1" stroke-width="6" stroke-linecap="round" />
    <line x1="180" y1="290" x2="390" y2="290" stroke="#CBD5E1" stroke-width="6" stroke-linecap="round" />
    
    <circle cx="340" cy="330" r="62" fill="url(#gold)" filter="url(#shadow)" />
    <text x="340" y="358" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="900" fill="#78350F" text-anchor="middle">$</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(ROOT_DIR, 'icon.svg'), svgIcon);

function createPng(size, bgR, bgG, bgB) {
  const width = size;
  const height = size;
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);
  const cornerRadius = size * 0.22;
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      
      let inBounds = true;
      let rx = 0;
      let ry = 0;
      if (x < cornerRadius) rx = cornerRadius - x;
      else if (x > width - cornerRadius) rx = x - (width - cornerRadius);
      if (y < cornerRadius) ry = cornerRadius - y;
      else if (y > height - cornerRadius) ry = y - (height - cornerRadius);
      
      if (rx > 0 && ry > 0) {
        if (rx * rx + ry * ry > cornerRadius * cornerRadius) {
          inBounds = false;
        }
      }
      
      if (!inBounds) {
        rawData[px] = 0;
        rawData[px + 1] = 0;
        rawData[px + 2] = 0;
        rawData[px + 3] = 0;
        continue;
      }
      
      const nbX1 = width * 0.22;
      const nbX2 = width * 0.82;
      const nbY1 = height * 0.16;
      const nbY2 = height * 0.84;
      
      if (x >= nbX1 && x <= nbX2 && y >= nbY1 && y <= nbY2) {
        if (x <= nbX1 + width * 0.1) {
          rawData[px] = 226;
          rawData[px + 1] = 232;
          rawData[px + 2] = 240;
          rawData[px + 3] = 255;
        } else {
          const coinX = width * 0.65;
          const coinY = height * 0.65;
          const coinR = width * 0.16;
          const distCoin = Math.sqrt((x - coinX) ** 2 + (y - coinY) ** 2);
          
          if (distCoin <= coinR) {
            rawData[px] = 245;
            rawData[px + 1] = 158;
            rawData[px + 2] = 11;
            rawData[px + 3] = 255;
          } else {
            const isLine = Math.floor(y / (height * 0.1)) % 2 === 0 && (y % (height * 0.1) < 3);
            if (isLine && x > nbX1 + width * 0.14 && x < nbX2 - width * 0.05) {
              rawData[px] = 203;
              rawData[px + 1] = 213;
              rawData[px + 2] = 225;
              rawData[px + 3] = 255;
            } else {
              rawData[px] = 255;
              rawData[px + 1] = 255;
              rawData[px + 2] = 255;
              rawData[px + 3] = 255;
            }
          }
        }
      } else {
        rawData[px] = bgR;
        rawData[px + 1] = bgG;
        rawData[px + 2] = bgB;
        rawData[px + 3] = 255;
      }
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crcVal = zlib.crc32(Buffer.concat([t, data]));
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, t, data, crc]);
  }
  
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const icon192 = createPng(192, 5, 150, 105);
fs.writeFileSync(path.join(ROOT_DIR, 'icon-192.png'), icon192);

const icon512 = createPng(512, 5, 150, 105);
fs.writeFileSync(path.join(ROOT_DIR, 'icon-512.png'), icon512);

console.log('Icons generated successfully.');
