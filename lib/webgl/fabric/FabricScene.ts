/**
 * FabricScene — the hero's WebGL cloth (built with OGL, ~30kb).
 *
 *   const scene = FabricScene.create(containerEl, { src: "/images/hero/hero-fabric.webp" });
 *   if (!scene) → WebGL isn't available: keep showing the poster image.
 *   scene.setRoll(0..1)   // from scroll
 *   scene.playIntro()     // cloth settles into place
 *   scene.destroy()
 *
 * Performance:
 *  - Renders only while the hero is on screen and the tab is visible.
 *  - Stops drawing completely once the cloth has rolled away.
 *  - Pixel ratio is capped (1.5 desktop, 1 on small screens).
 */
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { fabricFragment, fabricVertex } from "./shaders";

export type FabricOptions = {
  /** Texture URL. */
  src: string;
  /** Grid density. More = smoother folds, more GPU. */
  segments?: number;
  /** Max device pixel ratio. */
  maxDpr?: number;
  /** React to the cursor / finger. */
  interactive?: boolean;
  /** Called when the texture is on the GPU and the first frame is drawn. */
  onReady?: () => void;
  /** Called if the GPU drops the context — show the poster again. */
  onLost?: () => void;
};

const NIGHT = [15 / 255, 23 / 255, 54 / 255]; // --c-night

export class FabricScene {
  private renderer: Renderer;
  private gl: Renderer["gl"];
  private camera: Camera;
  private scene = new Transform();
  private program: Program;
  private mesh: Mesh;
  private container: HTMLElement;
  private opts: Required<Omit<FabricOptions, "onReady" | "onLost">> & Pick<FabricOptions, "onReady" | "onLost">;

  private raf = 0;
  private running = false;
  private onScreen = true;
  private ready = false;
  private destroyed = false;
  private start = performance.now();

  // Pointer state (world units)
  private mouse = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, lastMove: 0, inside: false };
  private hover = 0;
  private intro = { value: 0, from: 0, startedAt: -1 };
  private roll = 0;
  /** Visible screen size in world units (the plane itself is a bit bigger). */
  private view = { w: 1, h: 1 };

  private io?: IntersectionObserver;
  private ro?: ResizeObserver;

  /** Returns null when WebGL can't start (old device, disabled GPU…). */
  static create(container: HTMLElement, opts: FabricOptions): FabricScene | null {
    try {
      return new FabricScene(container, opts);
    } catch (err) {
      console.warn("[Fabric] WebGL unavailable, using poster image.", err);
      return null;
    }
  }

  private constructor(container: HTMLElement, opts: FabricOptions) {
    this.container = container;
    this.opts = { segments: 96, maxDpr: 1.5, interactive: true, ...opts };

    this.renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, this.opts.maxDpr),
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.gl = this.renderer.gl;
    if (!this.gl) throw new Error("No WebGL context");
    this.gl.clearColor(0, 0, 0, 0);

    const canvas = this.gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);
    canvas.addEventListener("webglcontextlost", this.handleLost, false);

    this.camera = new Camera(this.gl, { fov: 35, near: 0.1, far: 50 });
    this.camera.position.z = 5;

    const texture = new Texture(this.gl, { generateMipmaps: false });

    this.program = new Program(this.gl, {
      vertex: fabricVertex,
      fragment: fabricFragment,
      cullFace: false, // draw both sides — the back is visible inside the roll
      uniforms: {
        tMap: { value: texture },
        uImageSize: { value: [1, 1] },
        uSize: { value: [1, 1] },
        uTime: { value: 0 },
        uWind: { value: 1 },
        uMouse: { value: [0, 0] },
        uMouseVel: { value: [0, 0] },
        uHover: { value: 0 },
        uRoll: { value: 0 },
        uRadius: { value: 0.2 },
        uIntro: { value: 0 },
        uBackColor: { value: NIGHT },
      },
    });

    const seg = this.opts.segments;
    const geometry = new Plane(this.gl, { width: 1, height: 1, widthSegments: seg, heightSegments: seg });
    this.mesh = new Mesh(this.gl, { geometry, program: this.program });
    this.mesh.setParent(this.scene);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);

    // Only render while visible on screen
    this.io = new IntersectionObserver(([entry]) => {
      this.onScreen = entry.isIntersecting;
      this.updateRunning();
    });
    this.io.observe(container);
    document.addEventListener("visibilitychange", this.updateRunning);

    if (this.opts.interactive) {
      window.addEventListener("pointermove", this.handlePointer, { passive: true });
    }

    this.loadTexture(texture);
  }

  // ---------------------------------------------------------------- public

  /** 0 = flat, 1 = rolled away. Call from a scroll handler. */
  setRoll(p: number) {
    this.roll = Math.min(Math.max(p, 0), 1);
    this.updateRunning();
  }

  /** Cloth falls/settles into place (call once the intro starts). */
  playIntro() {
    this.intro.startedAt = performance.now();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    this.ro?.disconnect();
    document.removeEventListener("visibilitychange", this.updateRunning);
    window.removeEventListener("pointermove", this.handlePointer);
    const canvas = this.gl.canvas as HTMLCanvasElement;
    canvas.removeEventListener("webglcontextlost", this.handleLost);
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  }

  // --------------------------------------------------------------- private

  private async loadTexture(texture: Texture) {
    const img = new Image();
    img.decoding = "async";
    img.src = this.opts.src;
    try {
      await img.decode();
    } catch {
      return; // keep the poster
    }
    if (this.destroyed) return;
    texture.image = img;
    this.program.uniforms.uImageSize.value = [img.naturalWidth, img.naturalHeight];
    this.ready = true;
    this.render(performance.now());
    this.opts.onReady?.();
    this.updateRunning();
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.perspective({ aspect: w / h });
    // World-space size of the screen at z = 0 → the plane fills the view exactly
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * (w / h);
    this.view = { w: width, h: height };
    // The cloth is drawn 8% larger than the screen so its edges never
    // pull inward and show the page behind while it ripples (TUNE).
    const OVERSCAN = 1.08;
    this.program.uniforms.uSize.value = [width * OVERSCAN, height * OVERSCAN];
    // Roll thickness scales gently with screen height (TUNE)
    this.program.uniforms.uRadius.value = height * 0.065;
    if (this.ready && !this.running) this.render(performance.now());
  }

  private handlePointer = (e: PointerEvent) => {
    const r = this.container.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    this.mouse.inside = inside;
    if (!inside) return;
    const { w, h } = this.view;
    this.mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * w;
    this.mouse.ty = -((e.clientY - r.top) / r.height - 0.5) * h;
    this.mouse.lastMove = performance.now();
  };

  private handleLost = (e: Event) => {
    e.preventDefault();
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.opts.onLost?.();
  };

  private updateRunning = () => {
    const shouldRun =
      this.ready && !this.destroyed && this.onScreen && !document.hidden && this.roll < 0.999;
    if (shouldRun && !this.running) {
      this.running = true;
      this.raf = requestAnimationFrame(this.loop);
    } else if (!shouldRun && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
      // Draw one last frame so the final roll state is shown
      if (this.ready && !this.destroyed) this.render(performance.now());
    }
  };

  private loop = (now: number) => {
    if (!this.running) return;
    this.render(now);
    this.raf = requestAnimationFrame(this.loop);
  };

  private render(now: number) {
    const u = this.program.uniforms;
    const t = (now - this.start) / 1000;

    // Intro settle: 0 → 1 over 1.6s, eased out
    if (this.intro.startedAt >= 0) {
      const k = Math.min((now - this.intro.startedAt) / 1600, 1);
      this.intro.value = 1 - Math.pow(1 - k, 4);
    }

    // Smooth pointer + velocity
    const m = this.mouse;
    const px = m.x;
    const py = m.y;
    m.x += (m.tx - m.x) * 0.12;
    m.y += (m.ty - m.y) * 0.12;
    m.vx += ((m.x - px) * 6 - m.vx) * 0.15;
    m.vy += ((m.y - py) * 6 - m.vy) * 0.15;

    // "Hand" fades in while the cursor moves, out after ~1s of stillness
    const active = m.inside && now - m.lastMove < 1200 ? 1 : 0;
    this.hover += (active - this.hover) * 0.05;

    u.uTime.value = t;
    u.uIntro.value = this.intro.value;
    u.uMouse.value = [m.x, m.y];
    u.uMouseVel.value = [m.vx, m.vy];
    u.uHover.value = this.hover * (1 - this.roll); // the hand lets go as it rolls
    u.uRoll.value = this.roll;

    this.renderer.render({ scene: this.scene, camera: this.camera });
  }
}
