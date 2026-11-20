/**
 * hasFastWebGL — true only when WebGL runs on a real GPU.
 *
 * Some machines (and Google's PageSpeed / Lighthouse test servers) only have
 * SOFTWARE WebGL (SwiftShader, llvmpipe…). It "works" but every frame is
 * drawn by the CPU, which freezes the page. In that case we skip the WebGL
 * effects and show the still images instead — the page stays fast.
 */
let cached: boolean | null = null;

export function hasFastWebGL(): boolean {
  if (cached !== null) return cached;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    // The browser refuses this context when only slow, software WebGL exists.
    const gl = (canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("experimental-webgl", { failIfMajorPerformanceCaveat: true })) as WebGLRenderingContext | null;
    if (!gl) return (cached = false);

    // Belt and braces: check the renderer name for known software renderers.
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    cached = !/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(renderer);
  } catch {
    cached = false;
  }
  return cached;
}
