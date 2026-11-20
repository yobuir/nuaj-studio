/**
 * Fabric shaders (GLSL ES 1.00 — runs on WebGL1 and WebGL2).
 *
 * The plane is a grid of points (vertices). The VERTEX shader moves each
 * point to make the cloth ripple, dent under the hand, and roll up.
 * The FRAGMENT shader paints the photo onto it and lights the folds.
 *
 * ─── Uniforms (values sent from FabricScene.ts every frame) ───────────
 *  uSize      vec2   Plane size in world units (it always fills the screen).
 *  uTime      float  Seconds since start. Drives the wind.
 *  uWind      float  0–1. Strength of the gentle ambient ripple.
 *  uMouse     vec2   Cursor position on the plane (world units, 0,0 = centre).
 *  uMouseVel  vec2   Smoothed cursor velocity. Makes the cloth drag + crease.
 *  uHover     float  0–1. How much the "hand" is touching the cloth.
 *  uRoll      float  0–1. Scroll progress. 0 = flat, 1 = fully rolled up & gone.
 *  uRadius    float  Radius of the roll (world units). Bigger = fatter roll.
 *  uIntro     float  0–1. On load the cloth drops from the viewer and settles.
 *  tMap       tex    The fabric photo.
 *  uImageSize vec2   Photo size in px (to crop it like CSS object-fit: cover).
 *  uBackColor vec3   Colour of the cloth's reverse side (seen inside the roll).
 * ─────────────────────────────────────────────────────────────────────
 * Tweak the numbers marked "TUNE" to change the feel.
 */

export const fabricVertex = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec2  uSize;
uniform float uTime;
uniform float uWind;
uniform vec2  uMouse;
uniform vec2  uMouseVel;
uniform float uHover;
uniform float uRoll;
uniform float uRadius;
uniform float uIntro;

varying vec2  vUv;
varying vec3  vNormal;
varying float vCurl;

// 1) The cloth itself: wind + the hand + the intro "settle".
vec3 cloth(vec2 p) {
  vec3 o = vec3(p, 0.0);
  float t = uTime;

  // Wind: three slow travelling waves at different angles (TUNE amplitudes)
  float wind = sin(p.x * 1.2 + t * 0.7) * 0.07
             + sin(p.y * 1.9 - t * 0.55 + p.x * 0.6) * 0.05
             + sin((p.x * 0.8 + p.y) * 3.4 + t * 1.25) * 0.018;
  o.z += wind * uWind;

  // The hand: a soft dent under the cursor + small ripples around it
  vec2 d = p - uMouse;
  float r2 = dot(d, d);
  float press = exp(-r2 * 3.0);                       // TUNE: dent width
  o.z -= press * 0.28 * uHover;                       // TUNE: dent depth
  o.z += sin(sqrt(r2) * 10.0 - t * 5.0) * exp(-r2 * 1.6) * 0.035 * uHover;

  // Dragging: cloth is pulled along with the hand and creases across it
  o.xy += uMouseVel * press * 0.6;
  float speed = length(uMouseVel);
  if (speed > 0.0001) {
    vec2 dir = uMouseVel / speed;
    float across = dot(d, vec2(-dir.y, dir.x));
    o.z += sin(across * 14.0) * exp(-r2 * 2.5) * min(speed * 1.5, 0.12);
  }

  // Intro: cloth starts lifted toward the viewer and settles flat
  float settle = 1.0 - uIntro;
  o.z += settle * (0.9 + sin(p.x * 2.0 + t) * 0.2);
  return o;
}

// 2) The roll: everything below a moving line wraps around a cylinder
//    that sits in front of the cloth — like a blind rolling up.
vec3 rollUp(vec3 o) {
  float H = uSize.y;
  float line = mix(-0.5 * H - 0.02, 0.5 * H + uRadius * 2.5, uRoll);
  float dist = line - o.y;
  if (dist > 0.0) {
    float a = dist / uRadius;                         // angle around the roll
    float r = uRadius * max(1.0 - a * 0.025, 0.35);   // inner layers are tighter
    o.y = line - sin(a) * r;
    o.z = o.z * cos(a) + (1.0 - cos(a)) * r;
  }
  return o;
}

vec3 shape(vec2 p) { return rollUp(cloth(p)); }

void main() {
  vUv = uv;
  vec2 p = position.xy * uSize;

  vec3 pos = shape(p);

  // Normal from two nearby points — used for lighting the folds
  float e = 0.012;
  vec3 px = shape(p + vec2(e, 0.0));
  vec3 py = shape(p + vec2(0.0, e));
  vNormal = normalize(cross(px - pos, py - pos));

  float H = uSize.y;
  float line = mix(-0.5 * H - 0.02, 0.5 * H + uRadius * 2.5, uRoll);
  vCurl = clamp((line - p.y) / uRadius, 0.0, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const fabricFragment = /* glsl */ `
precision highp float;

uniform sampler2D tMap;
uniform vec2  uImageSize;
uniform vec2  uSize;
uniform vec3  uBackColor;
uniform float uTime;

varying vec2  vUv;
varying vec3  vNormal;
varying float vCurl;

// Crop the photo like CSS "object-fit: cover"
vec2 coverUv(vec2 uv) {
  float planeRatio = uSize.x / uSize.y;
  float imageRatio = uImageSize.x / uImageSize.y;
  vec2 s = planeRatio > imageRatio
    ? vec2(1.0, imageRatio / planeRatio)
    : vec2(planeRatio / imageRatio, 1.0);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 L = normalize(vec3(-0.45, 0.6, 1.0));          // TUNE: light direction
  vec3 V = vec3(0.0, 0.0, 1.0);

  if (!gl_FrontFacing) {
    // Reverse side: a plain night-indigo lining with a faint weave
    n = -n;
    float diff = clamp(dot(n, L), 0.0, 1.0);
    float weave = 0.04 * sin(vUv.x * 900.0) * sin(vUv.y * 900.0);
    vec3 col = uBackColor * (0.55 + 0.6 * diff) + weave;
    gl_FragColor = vec4(col, 1.0);
    return;
  }

  vec3 tex = texture2D(tMap, coverUv(vUv)).rgb;

  // Folds: soft diffuse light
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float shade = mix(0.6, 1.08, diff);

  // Sequins: bright pixels catch a specular glint when the cloth moves
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(n, H), 0.0), 36.0);
  float lum = dot(tex, vec3(0.299, 0.587, 0.114));
  vec3 col = tex * shade + spec * smoothstep(0.45, 0.9, lum) * 0.55;

  // Readability: deepen the bottom (headline) and top (header) edges
  col *= 0.86;
  col *= mix(0.42, 1.0, smoothstep(0.02, 0.62, vUv.y));
  col *= mix(0.55, 1.0, smoothstep(0.98, 0.82, vUv.y));
  // a soft dark pool behind the intro text on the right
  col *= 1.0 - 0.38 * smoothstep(0.42, 0.0, distance(vUv, vec2(0.86, 0.6)));

  // Shadow where the cloth starts curling into the roll
  col *= mix(1.0, 0.7, vCurl);

  gl_FragColor = vec4(col, 1.0);
}
`;
