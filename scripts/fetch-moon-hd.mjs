// Windows-safe NASA LRO WAC imagery conversion. NASA SVS 2025 color mosaics.
// npm run fetch:moon-hd    downloads the 4K TIFF (~59 MB) to make a JPEG.
// npm run fetch:moon-ultra downloads the 8K TIFF (~232 MB) to make a JPEG.
// Ultra is optional because an 8K uncompressed GPU texture uses ~128 MB.
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const isUltra = process.argv.includes('--size') && process.argv[process.argv.indexOf('--size') + 1] === '8k';
const size = isUltra ? '8k' : '4k';
const dest = new URL('../public/nasa-data/', import.meta.url);
await mkdir(dest, { recursive: true });
const outputFile = new URL(`lroc_color_${size}.jpg`, dest);
const outputPath = fileURLToPath(outputFile); // Sharp needs a native C:\\ path on Windows.
try {
  if ((await stat(outputFile)).size > 100_000) {
    console.log(`Cached NASA LRO ${size.toUpperCase()} Moon texture: ${outputPath}`);
    process.exit(0);
  }
} catch { /* not cached */ }
const source = `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_${size}.tif`;
console.log(`Downloading official NASA SVS ${size.toUpperCase()} source (${isUltra ? '~232 MB' : '~59 MB'}): ${source}`);
const response = await fetch(source, { signal: AbortSignal.timeout(isUltra ? 360_000 : 180_000) });
if (!response.ok) throw new Error(`NASA LRO imagery unavailable: HTTP ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.length < 5_000_000) throw new Error(`NASA source incomplete (${bytes.length} bytes); no fabricated fallback.`);
const { default: sharp } = await import('sharp');
const result = await sharp(bytes, { limitInputPixels: 80_000_000 })
  .jpeg({ quality: isUltra ? 88 : 87, effort: 4 })
  .toFile(outputPath);
console.log(`Success: ${result.width}x${result.height} JPEG saved to ${outputPath}`);
console.log(`Reopen the app's 3D Moon viewer to load the ${size.toUpperCase()} image.`);
