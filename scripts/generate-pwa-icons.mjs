import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const root = process.cwd();
const publicDir = path.join(root, 'public');

const jobs = [
  { svg: 'myicon.svg', out: 'myicon.png', size: 192 },
  { svg: 'myicon.svg', out: 'myicon_large.png', size: 512 },
  { svg: 'myicon-maskable.svg', out: 'myicon_maskable.png', size: 512 },
  { svg: 'myicon.svg', out: 'apple-touch-icon.png', size: 180 },
  { svg: 'myicon.svg', out: 'favicon-32x32.png', size: 32 },
  { svg: 'myicon.svg', out: 'favicon-16x16.png', size: 16 },
];

for (const job of jobs) {
  const svgPath = path.join(publicDir, job.svg);
  const outPath = path.join(publicDir, job.out);

  const svg = await fs.readFile(svgPath);

  // Use transparent background unless SVG defines one (it does).
  const png = await sharp(svg, { density: 384 })
    .resize(job.size, job.size)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await fs.writeFile(outPath, png);
  console.log(`generated ${job.out} (${job.size}x${job.size})`);
}
