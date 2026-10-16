// Generates all app icon / splash PNG assets from the SVG masters.
// Run: node scripts/generate-assets.mjs
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dir, '../public');

function rasterize(svgPath, outPath, width, height) {
  const svg = readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: undefined, // preserve transparency where needed
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  writeFileSync(outPath, png);
  console.log(`✓  ${outPath.replace(publicDir + '/', '')}  (${width}×${height})`);
}

// For splash we need a specific height — render at width and it comes out correct
// because the SVG already has the correct aspect ratio (1284:2778).

const tasks = [
  // icon.png — 1024×1024, navy bg + gear
  { svg: 'gear-icon.svg',       out: 'icon.png',                     w: 1024, h: 1024 },
  // adaptive-icon-foreground.png — 1024×1024, transparent bg, safe-padded gear
  { svg: 'gear-foreground.svg', out: 'adaptive-icon-foreground.png', w: 1024, h: 1024 },
  // favicon.png — 48×48
  { svg: 'gear-icon.svg',       out: 'favicon.png',                  w: 48,   h: 48   },
  // splash.png — 1284×2778
  { svg: 'splash.svg',          out: 'splash.png',                   w: 1284, h: 2778 },
];

console.log('Generating app assets…\n');
for (const { svg, out, w, h } of tasks) {
  rasterize(resolve(publicDir, svg), resolve(publicDir, out), w, h);
}
console.log('\nAll assets written to apps/mobile/public/');
