// Renders the to-do-tracker PWA icons (PNG) from the SVG sources in
// to-do-tracker/icons/. Run: node scripts/generate-todo-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../to-do-tracker/icons');
const jobs = [
  ...[72, 96, 128, 144, 152, 192, 384, 512].map(size => ({ src: 'icon.svg', out: `icon-${size}x${size}.png`, size })),
  { src: 'shortcut-add.svg', out: 'shortcut-add.png', size: 96 },
  { src: 'shortcut-tasks.svg', out: 'shortcut-tasks.png', size: 96 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { src, out, size } of jobs) {
  const svg = fs.readFileSync(path.join(dir, src)).toString('base64');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0"><img src="data:image/svg+xml;base64,${svg}" width="${size}" height="${size}" style="display:block"></body>`);
  await page.locator('img').evaluate(img => img.decode());
  await page.screenshot({ path: path.join(dir, out), omitBackground: true });
  console.log('wrote', out);
}
await browser.close();
