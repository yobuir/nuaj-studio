/**
 * HoverDistort — ONE shared WebGL canvas that hops into whichever image
 * you hover, and ripples it like cloth being touched.
 *
 * Usage: put data-distort on an element that contains an <img>.
 *   const hd = HoverDistort.create();      // null if WebGL unavailable
 *   hd.bind(rootElement);                  // watches all [data-distort] inside
 *   hd.destroy();
 *
 * ─── Uniforms ──────────────────────────────────────────────────────────
 *  tMap        the hovered image (re-uses the already-loaded <img>)
 *  uImageSize  image size in px (cover crop)
 *  uPlaneSize  element size in px
 *  uMouse      cursor position inside the element (0–1)
 *  uVel        cursor velocity — stronger push when moving fast
 *  uHover      0–1 fade in/out
 *  uTime       seconds
 * ──────────────────────────────────────────────────────────────────────
 */
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;

vec2 cover(vec2 uv) {
  float pr = uPlaneSize.x / uPlaneSize.y;
  float ir = uImageSize.x / uImageSize.y;
  vec2 s = pr > ir ? vec2(1.0, ir / pr) : vec2(pr / ir, 1.0);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uPlaneSize.x / uPlaneSize.y, 1.0);
  vec2 d = (uv - uMouse) * aspect;
  float dist = length(d);

  // ripples spreading from the finger, like touched cloth (TUNE)
  float ripple = sin(dist * 38.0 - uTime * 5.0) * exp(-dist * 6.0);
  // a soft push in the direction the cursor moves
  float push = exp(-dist * dist * 18.0);
  vec2 offset = normalize(d + 1e-5) * ripple * 0.012 + uVel * push * 0.08;
  offset *= uHover;

  // zoom in slightly while hovered
  vec2 zuv = (uv - 0.5) * (1.0 - 0.06 * uHover) + 0.5;

  // threads separate a little: split colour channels along the push
  vec2 base = cover(zuv + offset);
  vec2 split = uVel * push * 0.012 * uHover;
  float r = texture2D(tMap, base + split).r;
  float g = texture2D(tMap, base).g;
  float b = texture2D(tMap, base - split).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`;

export class HoverDistort {
  private renderer: Renderer;
  private gl: Renderer["gl"];
  private program: Program;
  private mesh: Mesh;
  private canvas: HTMLCanvasElement;
  private textures = new WeakMap<HTMLImageElement, Texture>();
  private host: HTMLElement | null = null;
  private hover = 0;
  private target = 0;
  private mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0 };
  private raf = 0;
  private start = performance.now();
  private cleanup: (() => void)[] = [];

  static create(): HoverDistort | null {
    try {
      return new HoverDistort();
    } catch {
      return null;
    }
  }

  private constructor() {
    this.renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: false, antialias: false });
    this.gl = this.renderer.gl;
    if (!this.gl) throw new Error("no webgl");
    this.canvas = this.gl.canvas as HTMLCanvasElement;
    this.canvas.setAttribute("aria-hidden", "true");
    Object.assign(this.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      opacity: "0",
      zIndex: "2",
    });
    this.program = new Program(this.gl, {
      vertex,
      fragment,
      uniforms: {
        tMap: { value: new Texture(this.gl) },
        uImageSize: { value: [1, 1] },
        uPlaneSize: { value: [1, 1] },
        uMouse: { value: [0.5, 0.5] },
        uVel: { value: [0, 0] },
        uHover: { value: 0 },
        uTime: { value: 0 },
      },
    });
    this.mesh = new Mesh(this.gl, { geometry: new Triangle(this.gl), program: this.program });
  }

  /** Watch every [data-distort] element inside root. */
  bind(root: HTMLElement) {
    const els = root.querySelectorAll<HTMLElement>("[data-distort]");
    els.forEach((el) => {
      const enter = (e: PointerEvent) => e.pointerType === "mouse" && this.attach(el, e);
      const move = (e: PointerEvent) => this.move(el, e);
      const leave = () => (this.target = 0);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      this.cleanup.push(() => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    });
  }

  /** Start the effect on a tile right away (used for the very first hover). */
  activate(el: HTMLElement, e: PointerEvent) {
    this.attach(el, e);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.cleanup.forEach((fn) => fn());
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.canvas.remove();
  }

  // ------------------------------------------------------------------

  private attach(el: HTMLElement, e: PointerEvent) {
    const img = el.querySelector("img");
    if (!img || !img.complete || !img.naturalWidth) return;

    let tex = this.textures.get(img);
    if (!tex) {
      tex = new Texture(this.gl, { image: img, generateMipmaps: false });
      this.textures.set(img, tex);
    }
    this.program.uniforms.tMap.value = tex;
    this.program.uniforms.uImageSize.value = [img.naturalWidth, img.naturalHeight];

    if (this.host !== el) {
      this.host = el;
      this.hover = 0;
      el.appendChild(this.canvas);
    }
    const r = el.getBoundingClientRect();
    this.renderer.setSize(r.width, r.height);
    this.program.uniforms.uPlaneSize.value = [r.width, r.height];
    this.move(el, e, true);
    this.target = 1;
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  }

  private move(el: HTMLElement, e: PointerEvent, snap = false) {
    if (el !== this.host) return;
    const r = el.getBoundingClientRect();
    this.mouse.tx = (e.clientX - r.left) / r.width;
    this.mouse.ty = 1 - (e.clientY - r.top) / r.height;
    if (snap) {
      this.mouse.x = this.mouse.tx;
      this.mouse.y = this.mouse.ty;
    }
  }

  private loop = (now: number) => {
    const m = this.mouse;
    const px = m.x;
    const py = m.y;
    m.x += (m.tx - m.x) * 0.15;
    m.y += (m.ty - m.y) * 0.15;
    m.vx += ((m.x - px) * 8 - m.vx) * 0.2;
    m.vy += ((m.y - py) * 8 - m.vy) * 0.2;
    this.hover += (this.target - this.hover) * 0.08;

    const u = this.program.uniforms;
    u.uMouse.value = [m.x, m.y];
    u.uVel.value = [m.vx, m.vy];
    u.uHover.value = this.hover;
    u.uTime.value = (now - this.start) / 1000;
    this.canvas.style.opacity = this.hover > 0.01 ? "1" : "0";
    this.renderer.render({ scene: this.mesh });

    // stop drawing once fully faded out
    if (this.target === 0 && this.hover < 0.005) {
      this.raf = 0;
      this.canvas.style.opacity = "0";
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };
}
