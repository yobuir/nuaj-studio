/**
 * ThreadField — slow, loose threads drifting across a dark background
 * (Commission section). Threads lean gently away from the cursor.
 *
 *   const f = new ThreadField(canvas, { count: 22 });
 *   f.destroy();
 *
 * Draws only while the canvas is on screen.
 */
type Options = {
  count?: number;
  colors?: string[];
  /** 0 = still (reduced motion). */
  speed?: number;
};

type Thread = { y: number; amp: number; freq: number; phase: number; speed: number; color: string; width: number };

export class ThreadField {
  private ctx: CanvasRenderingContext2D;
  private threads: Thread[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private running = false;
  private visible = false;
  private mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
  private io: IntersectionObserver;
  private ro: ResizeObserver;
  private speed: number;

  constructor(private canvas: HTMLCanvasElement, opts: Options = {}) {
    this.ctx = canvas.getContext("2d")!;
    this.speed = opts.speed ?? 1;
    const colors = opts.colors ?? ["rgba(184,164,107,0.55)", "rgba(242,238,230,0.28)", "rgba(147,212,194,0.35)", "rgba(42,69,184,0.7)"];
    const count = opts.count ?? 22;
    for (let i = 0; i < count; i++) {
      this.threads.push({
        y: (i + 0.5) / count + (Math.random() - 0.5) * 0.04,
        amp: 0.02 + Math.random() * 0.07,
        freq: 0.6 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.08 + Math.random() * 0.18,
        color: colors[i % colors.length],
        width: Math.random() < 0.15 ? 1.6 : 0.8,
      });
    }
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.update();
    });
    this.io.observe(canvas);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    window.addEventListener("pointermove", this.onMove, { passive: true });
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.io.disconnect();
    this.ro.disconnect();
    window.removeEventListener("pointermove", this.onMove);
  }

  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.tx = e.clientX - r.left;
    this.mouse.ty = e.clientY - r.top;
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
    const should = this.visible && this.speed > 0;
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
    const { ctx, w, h, dpr } = this;
    if (!w) return;
    const t = (now / 1000) * this.speed;
    const m = this.mouse;
    m.x += (m.tx - m.x) * 0.08;
    m.y += (m.ty - m.y) * 0.08;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const seg = 48;
    for (const th of this.threads) {
      ctx.beginPath();
      for (let i = 0; i <= seg; i++) {
        const u = i / seg;
        const x = u * w;
        let y =
          th.y * h +
          Math.sin(u * Math.PI * 2 * th.freq + th.phase + t * th.speed * 6) * th.amp * h +
          Math.sin(u * 9 + t * 0.7 + th.phase) * 4;
        // lean away from the cursor (TUNE radius/strength)
        const dx = x - m.x;
        const dy = y - m.y;
        const d2 = dx * dx + dy * dy;
        const R = 160;
        if (d2 < R * R * 4) {
          const f = Math.exp(-d2 / (R * R));
          y += (dy >= 0 ? 1 : -1) * f * 38;
        }
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = th.color;
      ctx.lineWidth = th.width;
      ctx.stroke();
    }
  }
}
