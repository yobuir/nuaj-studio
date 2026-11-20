/**
 * prepare-images.mjs
 * ------------------------------------------------------------------
 * Turns the original (huge, ~5000px) phone photos into web-sized,
 * clearly named files in /public/images.
 *
 * Run:  npm run images
 *
 * To swap an image: either change the `from` path below and re-run,
 * or simply drop a new file into /public/images with the SAME name.
 * ------------------------------------------------------------------
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

const SRC = path.resolve("../images/NUAJ/SAM PROJECT 001");
const OUT = path.resolve("public/images");

/** Each entry: where it comes from → where it goes, plus max width. */
const jobs = [
  // HERO — the WebGL fabric texture (webp, power-of-two-ish width) + poster
  // Desktop files are cropped to a 16:10 band (what a wide screen shows),
  // mobile files keep the tall portrait framing. Smaller files = faster hero.
  { from: "IMG_7391.jpg", to: "hero/hero-fabric.webp", width: 1920, crop: 16 / 10, quality: 70 },
  { from: "IMG_7391.jpg", to: "hero/hero-fabric-mobile.webp", width: 900, crop: 9 / 16, quality: 68 },
  { from: "IMG_7391.jpg", to: "hero/hero-poster.jpg", width: 1920, crop: 16 / 10 },
  { from: "IMG_7391.jpg", to: "hero/hero-poster-mobile.jpg", width: 1000, crop: 9 / 16 },

  // WORK — "The Mosaic of Our Story" (client commission, 2025)
  { from: "IMG_7279.JPG", to: "works/mosaic-of-our-story/cover.jpg", width: 2000 },
  { from: "IMG_7277.JPG", to: "works/mosaic-of-our-story/in-the-light.jpg", width: 2000 },
  { from: "IMG_7399.JPG", to: "works/mosaic-of-our-story/detail-leaf.jpg", width: 2000 },
  { from: "IMG_7264.JPG", to: "works/mosaic-of-our-story/detail-sequins.jpg", width: 2000 },
  { from: "IMG_7389.JPG", to: "works/mosaic-of-our-story/detail-strips.jpg", width: 2000 },
  { from: "IMG_7384.JPG", to: "works/mosaic-of-our-story/label.jpg", width: 1600 },
  { from: "IMG_7409.jpg", to: "works/mosaic-of-our-story/wrapped.jpg", width: 1600 },

  // PROCESS — Gather → Cut → Compose → Stitch
  { from: "Fabric/IMG_6964.jpg", to: "process/01-gather.jpg", width: 1600 },
  { from: "Process - cutting /IMG_6939.jpg", to: "process/02-cut.jpg", width: 1600 },
  { from: "Composition /IMG_7209.JPG", to: "process/03-compose.jpg", width: 1600 },
  { from: "IMG_7245.JPG", to: "process/04-stitch.jpg", width: 1600 },
  // small, ready-made source for the Process canvas (loads instantly)
  { from: "IMG_7389.JPG", to: "process/canvas-source.webp", width: 760, quality: 68 },

  // DISCIPLINES
  { from: "Fabric/IMG_6961.jpg", to: "disciplines/textile-design.jpg", width: 1800 },
  { from: "Fabric/IMG_6957.jpg", to: "disciplines/wearables.jpg", width: 1800 },
  { from: "IMG_7272.jpg", to: "disciplines/commissions.jpg", width: 1800 },
];

for (const job of jobs) {
  const src = path.join(SRC, job.from);
  const dest = path.join(OUT, job.to);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  let img = sharp(src).rotate();
  if (job.crop) {
    // centre-crop to the requested aspect ratio (width / height)
    const rotated = await sharp(src).rotate().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = rotated.info;
    const cw = Math.min(w, Math.round(h * job.crop));
    const ch = Math.min(h, Math.round(w / job.crop));
    img = sharp(rotated.data).extract({ left: Math.round((w - cw) / 2), top: Math.round((h - ch) / 2), width: cw, height: ch });
  }
  img = img.resize({ width: job.width, withoutEnlargement: true });
  img = dest.endsWith(".webp")
    ? img.webp({ quality: job.quality ?? 82 })
    : img.jpeg({ quality: 82, mozjpeg: true, progressive: true });
  await img.toFile(dest);
  console.log("✓", job.to);
}

// Open Graph image (1200×630) cropped from the hero fabric
await sharp(path.join(SRC, "IMG_7391.jpg"))
  .rotate()
  .resize(1200, 630, { fit: "cover", position: "attention" })
  .jpeg({ quality: 80 })
  .toFile(path.join(OUT, "og-image.jpg"));
console.log("✓ og-image.jpg");
