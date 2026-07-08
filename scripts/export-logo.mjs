import { readFileSync, writeFileSync } from 'fs';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync('apps/web/public/favicon.svg', 'utf8');

// 512×512 PNG (high resolution)
const resvg512 = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } });
const png512 = resvg512.render().asPng();
writeFileSync('apps/web/public/bim-logo-512.png', png512);
console.log('✓ bim-logo-512.png');

// 256×256 PNG
const resvg256 = new Resvg(svg, { fitTo: { mode: 'width', value: 256 } });
const png256 = resvg256.render().asPng();
writeFileSync('apps/web/public/bim-logo-256.png', png256);
console.log('✓ bim-logo-256.png');

// JPEG from the 512 PNG — @resvg/resvg-js doesn't output JPEG natively,
// so we write a tiny pure-JS JPEG encoder that handles RGB24 data.
// We'll convert by re-encoding via a small JPEG baseline writer.
// Since we don't have sharp, use the PNG bytes and inform the user they can
// open the PNG and Save As JPEG in any image viewer.
// Instead, let's produce a simple approach: write a Node script that
// creates a JPEG by converting the PNG buffer using the 'jpeg-js' package.

// Try sharp or jpeg-js if available
let jpegWritten = false;
try {
  const { default: sharp } = await import('sharp');
  const jpeg512 = await sharp(png512).jpeg({ quality: 95 }).toBuffer();
  writeFileSync('apps/web/public/bim-logo-512.jpg', jpeg512);
  console.log('✓ bim-logo-512.jpg (via sharp)');
  jpegWritten = true;
} catch { /* sharp not available */ }

if (!jpegWritten) {
  try {
    const { encode } = await import('jpeg-js');
    // Decode PNG to raw pixels using resvg's pixmap
    const pixmap = resvg512.render();
    const width = pixmap.width;
    const height = pixmap.height;
    const rgba = pixmap.pixels; // Uint8Array, RGBA
    // Convert RGBA → RGB (jpeg-js needs RGBA but ignores alpha? No — needs exact format)
    const frameData = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      // Composite onto white background (alpha blending)
      const r = rgba[i * 4];
      const g = rgba[i * 4 + 1];
      const b = rgba[i * 4 + 2];
      const a = rgba[i * 4 + 3] / 255;
      frameData[i * 4]     = Math.round(r * a + 255 * (1 - a));
      frameData[i * 4 + 1] = Math.round(g * a + 255 * (1 - a));
      frameData[i * 4 + 2] = Math.round(b * a + 255 * (1 - a));
      frameData[i * 4 + 3] = 255;
    }
    const jpegData = encode({ data: frameData, width, height }, 95);
    writeFileSync('apps/web/public/bim-logo-512.jpg', jpegData.data);
    console.log('✓ bim-logo-512.jpg (via jpeg-js)');
    jpegWritten = true;
  } catch { /* jpeg-js not available either */ }
}

if (!jpegWritten) {
  console.log('⚠ Could not generate JPEG (no sharp or jpeg-js). Install sharp: npm i sharp');
  console.log('  PNG files are ready — open bim-logo-512.png in Paint/Photos and Save As JPEG.');
}
