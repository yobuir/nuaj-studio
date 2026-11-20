/**
 * ProcessField — the Canvas 2D visual for the Process section.
 *
 * Every particle is one small piece of cloth. Its colour is sampled from
 * the finished artwork, so by the last step the pieces land exactly where
 * their colour belongs and the image appears.
 *
 *   step 0  GATHER   loose fibres drifting
 *   step 1  CUT      pieces line up into wavy horizontal strips (cut lace)
 *   step 2  COMPOSE  strips are rearranged into vertical columns on a loom grid
 *   step 3  STITCH   pieces snap into the mosaic → the real photo fades in
 *
 *   const field = new ProcessField(canvas, { src, density });
 *   field.setProgress(0..3)   // from scroll (fractional = in between steps)
 *   field.destroy()
 */

type Options = {
  src: string;
  /** Pieces across the width. ~44 desktop, ~28 phones. */
  density?: number;
  colors?: { bg: string; grid: string };
  /** Called once the artwork is sampled and the first frame is drawn. */
  onReady?: () => void;
};

type P = {
  // positions for each step (0–1 space, y relative to height)
  sx: Float32Array; // x per step
  sy: Float32Array; // y per step
  sa: Float32Array; // angle per step
  color: string;
  delay: number;
  seed: number;
};

const STEPS = 4;
const TAU = Math.PI * 2;

export class ProcessField {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private opts: Required<Omit<Options, "onReady">> & Pick<Options, "onReady">;
  private particles: P[] = [];
  private img: HTMLImageElement | null = null;
  private cols = 0;
  private rows = 0;
  private progress = 0;
  private shown = 0; // smoothed progress
  private raf = 0;
  private running = false;
  private visible = false;
  private destroyed = false;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private io: IntersectionObserver;
  private ro: ResizeObserver;
  private t0 = performance.now();

  constructor(canvas: HTMLCanvasElement, opts: Options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.opts = { density: 44, colors: { bg: "#f2eee6", grid: "rgba(21,22,28,0.10)" }, ...opts };
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.update();
    });
    this.io.observe(canvas);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.load();
  }

  setProgress(p: number) {
    this.progress = Math.max(0, Math.min(STEPS - 1, p));
    this.update();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.io.disconnect();
    this.ro.disconnect();
  }

  // ------------------------------------------------------------------

  private async load() {
    const img = new Image();
    img.decoding = "async";
    img.src = this.opts.src;
    try {
      await img.decode();
    } catch {
      return;
    }
    if (this.destroyed) return;
    this.img = img;
    this.build();
    this.resize();
    this.update();
    this.opts.onReady?.();
  }

  /** Create particles + their four target layouts. */
  private build() {
    const img = this.img!;
    const cols = this.opts.density;
    const aspect = 5 / 4; // canvas is 4:5 portrait (h / w)
    const rows = Math.round(cols * aspect);
    this.cols = cols;
    this.rows = rows;

    // sample colours from the artwork (cover-fit into cols × rows)
    const sample = document.createElement("canvas");
    sample.width = cols;
    sample.height = rows;
    const sctx = sample.getContext("2d", { willReadFrequently: true })!;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cols / rows;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (ir > cr) sw = sh * cr;
    else sh = sw / cr;
    sctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, cols, rows);
    const data = sctx.getImageData(0, 0, cols, rows).data;

    const rnd = mulberry32(7);
    const n = cols * rows;
    const STRIPS_H = 7; // cut strips
    const STRIPS_V = 6; // composed columns
    this.particles = [];

    for (let k = 0; k < n; k++) {
      const gx = k % cols;
      const gy = Math.floor(k / cols);
      const o = k * 4;
      const color = `rgb(${data[o]},${data[o + 1]},${data[o + 2]})`;
      const sx = new Float32Array(STEPS);
      const sy = new Float32Array(STEPS);
      const sa = new Float32Array(STEPS);

      // 0 GATHER — scattered, slightly clustered toward the centre
      const r = Math.sqrt(rnd()) * 0.48;
      const th = rnd() * TAU;
      sx[0] = 0.5 + Math.cos(th) * r;
      sy[0] = 0.5 + Math.sin(th) * r * 1.1;
      sa[0] = rnd() * TAU;

      // 1 CUT — horizontal wavy strips (like cut lace trim)
      const hs = k % STRIPS_H;
      const ht = (Math.floor(k / STRIPS_H) / (n / STRIPS_H)) ; // 0..1 along strip
      const hx = 0.06 + ht * 0.88;
      sx[1] = hx;
      sy[1] = 0.12 + hs * 0.125 + Math.sin(ht * TAU * 3 + hs) * 0.03 + (rnd() - 0.5) * 0.04;
      sa[1] = Math.atan(Math.cos(ht * TAU * 3 + hs) * 0.6);

      // 2 COMPOSE — vertical wavy columns, like the finished mosaic
      const vs = gx % STRIPS_V;
      const vt = (gy + (gx / cols)) / rows;
      sx[2] = 0.1 + vs * (0.8 / (STRIPS_V - 1)) + Math.sin(vt * TAU * 2.5 + vs * 1.3) * 0.035 + (rnd() - 0.5) * 0.05;
      sy[2] = 0.05 + vt * 0.9;
      sa[2] = Math.PI / 2 + Math.atan(Math.cos(vt * TAU * 2.5 + vs) * 0.5);

      // 3 STITCH — exact place in the image
      sx[3] = (gx + 0.5) / cols;
      sy[3] = (gy + 0.5) / rows;
      sa[3] = 0;

      this.particles.push({ sx, sy, sa, color, delay: rnd(), seed: rnd() * 100 });
    }
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.draw(performance.now());
  }

  private update() {
    const should = this.visible && !!this.img && !this.destroyed;
    if (should && !this.running) {
      this.running = true;
      this.raf = requestAnimationFrame(this.loop);
    } else if (!should && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
  }

  private loop = (now: number) => {
    if (!this.running) return;
    this.draw(now);
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw(now: number) {
    if (!this.img || !this.w) return;
    const { ctx, w, h, dpr } = this;
    const t = (now - this.t0) / 1000;
    this.shown += (this.progress - this.shown) * 0.12;
    const p = this.shown;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = this.opts.colors.bg;
    ctx.fillRect(0, 0, w, h);

    // Loom grid fades in for COMPOSE and stays faint after
    const gridA = smooth(1.2, 2, p) * (1 - 0.6 * smooth(2.5, 3, p));
    if (gridA > 0.01) {
      ctx.strokeStyle = this.opts.colors.grid;
      ctx.globalAlpha = gridA;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const step = w / 12;
      for (let x = step; x < w; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = step; y < h; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const cellW = w / this.cols;
    const cellH = h / this.rows;
    const base = Math.floor(p);
    const frac = p - base;
    const next = Math.min(base + 1, STEPS - 1);

    for (const q of this.particles) {
      // each piece moves a little later/earlier than its neighbours
      const k = easeInOut(clamp01((frac - q.delay * 0.35) / 0.65));
      let x = lerp(q.sx[base], q.sx[next], k);
      let y = lerp(q.sy[base], q.sy[next], k);
      const a = lerpAngle(q.sa[base], q.sa[next], k);

      // drifting while loose (fades out as the pieces get organised)
      const loose = 1 - smooth(0, 1, p);
      if (loose > 0) {
        x += Math.sin(t * 0.6 + q.seed) * 0.012 * loose;
        y += Math.cos(t * 0.5 + q.seed * 1.3) * 0.012 * loose;
      }

      // shape: long thin fibre → short strip piece → square tile
      const tile = smooth(2.2, 3, p);
      const len = lerp(lerp(cellW * 1.6, cellW * 1.15, smooth(0, 1, p)), cellW * 1.02, tile);
      const thick = lerp(lerp(1.2, cellH * 0.55, smooth(0.3, 1.3, p)), cellH * 1.02, tile);

      // position + rotation in one call (cheaper than save/translate/rotate/restore)
      const ang = a * (1 - tile);
      const c = Math.cos(ang) * dpr;
      const s = Math.sin(ang) * dpr;
      ctx.setTransform(c, s, -s, c, x * w * dpr, y * h * dpr);
      ctx.fillStyle = q.color;
      ctx.fillRect(-len / 2, -thick / 2, len, thick);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // STITCH: the real photograph resolves over the mosaic
    const photo = smooth(2.65, 3, p);
    if (photo > 0.01) {
      ctx.globalAlpha = photo;
      drawCover(ctx, this.img, w, h);
      ctx.globalAlpha = 1;
    }
  }
}

// ---------------------------------------------------------------- utils
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function lerpAngle(a: number, b: number, t: number) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
}
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (ir > cr) sw = sh * cr;
  else sh = sw / cr;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
}
/** Small seeded random — same layout on every visit. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
