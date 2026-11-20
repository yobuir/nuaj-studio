/**
 * LoomGrid — warp (vertical) and weft (horizontal) threads, like cloth
 * stretched on a loom. Near the cursor the threads bulge apart, as if a
 * finger were pressing into the weave. Used in the footer.
 *
 *   const g = new LoomGrid(canvas, { gap: 28 });
 *   g.destroy();
 */
type Options = { gap?: number; color?: string; still?: boolean };

export class LoomGrid {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private running = false;
  private visible = false;
  private m = { x: -9999, y: -9999, tx: -9999, ty: -9999, s: 0, ts: 0 };
  private io: IntersectionObserver;
  private ro: ResizeObserver;
  private gap: number;
  private color: string;
  private still: boolean;

  constructor(private canvas: HTMLCanvasElement, opts: Options = {}) {
    this.ctx = canvas.getContext("2d")!;
    this.gap = opts.gap ?? 28;
    this.color = opts.color ?? "rgba(242,238,230,0.16)";
    this.still = !!opts.still;
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.update();
    });
    this.io.observe(canvas);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    if (!this.still) {
      window.addEventListener("pointermove", this.onMove, { passive: true });
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.io.disconnect();
    this.ro.disconnect();
    window.removeEventListener("pointermove", this.onMove);
  }

  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    this.m.tx = e.clientX - r.left;
    this.m.ty = e.clientY - r.top;
    this.m.ts = inside ? 1 : 0;
  };

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.draw(performance.now());
  }

  private update() {
    const should = this.visible && !this.still;
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

  /** Push a point away from the cursor. */
  private bend(x: number, y: number, t: number): [number, number] {
    const m = this.m;
    const dx = x - m.x;
    const dy = y - m.y;
    const d2 = dx * dx + dy * dy;
    const R = 130; // TUNE: size of the "finger"
    const f = Math.exp(-d2 / (R * R)) * 26 * m.s; // TUNE: depth
    const d = Math.sqrt(d2) || 1;
    // a slow breathing shift, so it never looks frozen
    const drift = Math.sin(y * 0.01 + t * 0.4) * 1.5;
    return [x + (dx / d) * f + drift, y + (dy / d) * f];
  }

  private draw(now: number) {
    const { ctx, w, h, dpr, gap } = this;
    if (!w) return;
    const t = now / 1000;
    const m = this.m;
    m.x += (m.tx - m.x) * 0.1;
    m.y += (m.ty - m.y) * 0.1;
    m.s += (m.ts - m.s) * 0.06;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    const step = 14;

    ctx.beginPath();
    // warp
    for (let x = gap / 2; x < w; x += gap) {
      for (let y = 0; y <= h; y += step) {
        const [px, py] = this.bend(x, y, t);
        if (y === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    // weft
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = 0; x <= w; x += step) {
        const [px, py] = this.bend(x, y, t);
        if (x === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }
}
