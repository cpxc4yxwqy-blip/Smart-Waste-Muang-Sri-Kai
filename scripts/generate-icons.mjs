#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('branding', 'logo.png'); // Provide high-res square logo here
const OUT = path.resolve('public', 'icons');
const SIZES = [192, 512];

async function run() {
  if (!fs.existsSync(SRC)) {
    console.error('Source logo not found:', SRC);
    console.error('Please place a square PNG at branding/logo.png before running.');
    process.exit(1);
  }
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  for (const size of SIZES) {
    const outFile = path.join(OUT, `icon-${size}.png`);
    await sharp(SRC).resize(size, size).png({ compressionLevel: 9 }).toFile(outFile);
    console.log('Generated', outFile);
  }

  // Create maskable icon (same size 512) with padding for safe area
  const maskableFile = path.join(OUT, 'icon-maskable-512.png');
  const padding = 64; // 512 - (512 - 2*padding) safe content
  const base = await sharp({ create: { width: 512, height: 512, channels: 4, background: { r:255, g:255, b:255, alpha:0 } } }).png().toBuffer();
  const resized = await sharp(SRC).resize(512 - padding*2, 512 - padding*2).png().toBuffer();
  await sharp(base).composite([{ input: resized, top: padding, left: padding }]).png({ compressionLevel: 9 }).toFile(maskableFile);
  console.log('Generated', maskableFile);

  console.log('Done. Update manifest with maskable icon if not already included.');
}

run().catch(e => { console.error(e); process.exit(1); });
