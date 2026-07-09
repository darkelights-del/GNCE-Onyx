/**
 * onyx3d — the home hero as a real WebGL scene.
 *
 * The ONYX word is four letters of genuine extruded geometry (the Uncial
 * Antiqua outlines, src/data/onyx-glyphs.ts), lit like dark onyx stone:
 * a deep-purple body, off-white key, crimson rim. The camera tracks across
 * the word on scroll, dollying into each letter while its content is born
 * from the frame; between them it glides like one continuous take.
 *
 * Because the letters are geometry, they are crisp at every distance and
 * carry real depth and specular character — no upscaled-texture blur.
 *
 * Falls back to a static, readable stacked page when WebGL is unavailable
 * or the visitor prefers reduced motion (adds html.no3d; never adds
 * html.onyx-live, which is what switches the canvas on).
 */
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Text as TroikaText } from 'troika-three-text';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GLYPHS } from '../data/onyx-glyphs';
// Self-hosted TTFs, bundled to same-origin hashed URLs by Vite (no CDN).
import uncialUrl from '../fonts/UncialAntiqua-Regular.ttf?url';
import cardoUrl from '../fonts/Cardo-Regular.ttf?url';
import greyUrl from '../fonts/GreyQo-Regular.ttf?url';

gsap.registerPlugin(ScrollTrigger);

const CHARS = ['O', 'N', 'Y', 'X'] as const;
const GLYPH_SCALE = 0.01; // glyph em units -> world units
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
// Touch / low-power devices: drop shadows, bloom, DPR and particle count.
const LOWPERF = matchMedia('(pointer: coarse)').matches;

function webglOK(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function fallback() {
  document.documentElement.classList.add('no3d');
  // Reveal the content that the 3D path would have animated.
  document.querySelectorAll<HTMLElement>('.flow, .flow-line').forEach((el) => {
    el.style.opacity = '1';
    el.style.clipPath = 'none';
    el.style.visibility = 'visible';
  });
}

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.querySelector<HTMLCanvasElement>('[data-onyx-canvas]');

if (!canvas || REDUCED || !webglOK()) {
  fallback();
} else {
  try {
    boot(canvas);
  } catch (err) {
    fallback();
  }
}

function boot(canvas: HTMLCanvasElement) {
  const section = document.querySelector<HTMLElement>('[data-onyx3d]')!;
  const stage = section.querySelector<HTMLElement>('.onyx3d-stage')!;
  const groupsEl = gsap.utils.toArray<HTMLElement>('[data-flow]');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOWPERF ? 1 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.65;
  renderer.shadowMap.enabled = !LOWPERF;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  // Purple depth-haze + a deep-violet backdrop so the void is atmospheric, never
  // a flat black gap: distant geometry and the empty transit beats recede into
  // onyx-violet, and the letters dissolve into / emerge from the haze.
  scene.fog = new THREE.FogExp2(0x0f0814, 0.012);
  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(72, 64, 40),
    new THREE.MeshBasicMaterial({ color: 0x0f0814, side: THREE.BackSide, fog: false }),
  );
  scene.add(backdrop);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);

  // Custom onyx environment: a dark room lit only by palette-colored panels,
  // so the polished clearcoat reflects crimson / purple / off-white glints,
  // not the neutral studio gray of RoomEnvironment (which reads as chrome).
  const envScene = new THREE.Scene();
  const panel = (color: number, intensity: number, x: number, y: number, z: number, w: number, h: number) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
    (mesh.material as THREE.MeshBasicMaterial).color.multiplyScalar(intensity);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
  };
  // Palette only: the metal reflects off-white (the "white/silver" sheen),
  // crimson and purple — never a neutral gray.
  // Purple + crimson dominate the reflections so the metal reads as violet
  // onyx; off-white is a COMPACT specular key (a glint), never a broad wash.
  panel(0xe8e2dc, 3.2, -8, 9, 8, 8, 8); // compact off-white specular key
  panel(0x6e0d25, 2.6, 12, 1, 5, 15, 16); // crimson, right — deep wine, kept below the hot-pink blowout
  panel(0x2b1b2f, 3.6, -6, -4, -9, 16, 16); // purple fill, lower-back
  panel(0x1a0f20, 2.8, 0, 0, 12, 26, 26); // deep-purple front fill (purple, not white — keeps faces violet)
  panel(0x6e0d25, 1.8, 9, 2, -11, 18, 18); // crimson back-fill so orbits read wine, never gray
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.05).texture;

  // Real polished onyx: a near-black metal body with a clearcoat lacquer. The
  // metal reflection stays dark (onyx), the clearcoat adds the white/silver
  // sheen on top — a metallic body with white/silver, done for real.
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x2b1b2f, // palette panel purple — the lit onyx body reads violet, not gray
    metalness: 0.5, // lower: violet diffuse reads instead of a gray mirror
    roughness: 0.36, // softens the specular so highlights read as sheen, not chrome
    envMapIntensity: 1.25,
    clearcoat: 0.7, // off-white clearcoat glint on top
    clearcoatRoughness: 0.2,
    emissive: 0x160a18, // faint purple floor so faces never fall to gray/black
    emissiveIntensity: 0.55,
    side: THREE.DoubleSide, // never cull a face to reveal the hollow interior
  });

  // One shadow-casting key (warm), a cool purple back-rim, a crimson rim, a
  // hemisphere fill, and a low ambient so faces never fall to pure black when
  // the camera swings behind a letter.
  scene.add(new THREE.AmbientLight(0x2a2036, 0.5));
  const key = new THREE.SpotLight(0xf3e4cc, 320, 60, Math.PI / 6, 0.45, 2); // warm off-white key: sheen reads cream, not neutral silver
  key.position.set(-7, 13, 10);
  key.castShadow = !LOWPERF;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 46;
  scene.add(key);
  const backRim = new THREE.DirectionalLight(0x5a2440, 1.9); backRim.position.set(6, 4, -8); scene.add(backRim); // purple-crimson (no blue fringe)
  const crimsonRim = new THREE.DirectionalLight(0x6e0d25, 1.8); crimsonRim.position.set(-4, -2, -6); scene.add(crimsonRim);
  const hemi = new THREE.HemisphereLight(0x3a2440, 0x0a0908, 0.8); scene.add(hemi); // purple sky, coal ground
  const fill = new THREE.DirectionalLight(0x4a2c50, 0.8); fill.position.set(0, 2, 16); scene.add(fill); // gentle violet front-fill so faces read at the wide overview

  // Shadow catcher: a plane below the letters so the cast shadow reads over
  // coal without an off-brand bright floor.
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(90, 44), new THREE.ShadowMaterial({ opacity: 0.55 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = -4.0;
  catcher.receiveShadow = true;
  scene.add(catcher);

  // ---- Embers: additive points drifting up through the scene ----------
  // Crimson + off-white, rising, turbulence scaling with scroll velocity.
  function emberTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }
  const EMBERS = LOWPERF ? 180 : 340;
  const emberData: { sx: number; sy: number; sz: number; sway: number; swayR: number; phase: number }[] = [];
  const emberPos = new Float32Array(EMBERS * 3);
  const emberCol = new Float32Array(EMBERS * 3);
  for (let i = 0; i < EMBERS; i++) {
    emberPos[i * 3] = (Math.random() - 0.5) * 42;
    emberPos[i * 3 + 1] = (Math.random() - 0.5) * 32;
    emberPos[i * 3 + 2] = (Math.random() - 0.5) * 26 - 4;
    // Mostly off-white dust motes with a crimson minority — atmosphere, not noise.
    if (Math.random() < 0.28) { emberCol[i * 3] = 0.55; emberCol[i * 3 + 1] = 0.05; emberCol[i * 3 + 2] = 0.12; }
    else { emberCol[i * 3] = 0.91; emberCol[i * 3 + 1] = 0.886; emberCol[i * 3 + 2] = 0.86; }
    emberData.push({ sx: (Math.random() - 0.5) * 0.4, sy: 0.12 + Math.random() * 0.4, sz: (Math.random() - 0.5) * 0.35, sway: 0.4 + Math.random() * 1.2, swayR: 0.06 + Math.random() * 0.16, phase: Math.random() * Math.PI * 2 });
  }
  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  emberGeo.setAttribute('color', new THREE.BufferAttribute(emberCol, 3));
  const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({
    size: 0.07, vertexColors: true, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, map: emberTexture(),
  }));
  scene.add(embers);

  // ---- Build the letters from the Uncial outlines --------------------
  // Small bevel: a fat bevel self-intersects on the tight concave corners of
  // N / X / Y and z-fights into visible seams. Keep it tight and smooth.
  function buildGeometry(d: string) {
    const parsed = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
    const shapes: THREE.Shape[] = [];
    for (const p of parsed.paths) shapes.push(...SVGLoader.createShapes(p));
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 150, bevelEnabled: true, bevelThickness: 7, bevelSize: 5, bevelOffset: 0, bevelSegments: 2, curveSegments: 14,
    });
    geo.scale(GLYPH_SCALE, -GLYPH_SCALE, GLYPH_SCALE); // flip y (glyph is y-down) -> upright
    geo.center();
    // Crisp, hard-edged shading: keep the geometry non-indexed (ExtrudeGeometry
    // is) and compute FLAT per-face normals. Welding + smoothing was averaging
    // normals across the cap/wall/bevel edges, smearing them into one another so
    // the front, sides and back never read as separate planes. Double-sided
    // material makes the flip introduced by the y-mirror irrelevant.
    const g = geo.toNonIndexed();
    g.computeVertexNormals();
    return g;
  }

  const group = new THREE.Group();
  scene.add(group);
  const widths = CHARS.map((c) => (GLYPHS[c].bbox.x2 - GLYPHS[c].bbox.x1) * GLYPH_SCALE);
  const gap = 2.1;
  const letterX: number[] = [];
  const total = widths.reduce((a, b) => a + b, 0) + gap * (CHARS.length - 1);
  let x = -total / 2;
  const meshes: THREE.Mesh[] = CHARS.map((c, i) => {
    const m = new THREE.Mesh(buildGeometry(GLYPHS[c].d), material);
    m.castShadow = true;
    m.receiveShadow = true;
    x += widths[i] / 2;
    m.position.x = x;
    letterX.push(x);
    x += widths[i] / 2 + gap;
    group.add(m);
    return m;
  });

  const L = letterX; // [O, N, Y, X] centres

  // Distant crimson glows deep in the haze behind the word: the behind-letter
  // transits (through the O, around N/Y/X) fly toward soft warmth instead of a
  // black void. Additive, so they bloom; occluded by the letters from the front.
  const glowPos = new Float32Array([
    L[0], 0.4, -11, L[1], -1.2, -13, L[2], 1.6, -12.5, L[3], -0.4, -13, -3, 4, -16, 5, -3.5, -15.5,
  ]);
  const glowGeo = new THREE.BufferGeometry();
  glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
  const glows = new THREE.Points(glowGeo, new THREE.PointsMaterial({
    color: 0x6e0d25, size: 10, transparent: true, opacity: 0.42,
    blending: THREE.AdditiveBlending, depthWrite: false, map: emberTexture(), sizeAttenuation: true,
  }));
  scene.add(glows);

  // ---- Depth-woven words: real troika text that shares the depth buffer,
  // so the letters occlude it — it goes behind, in front, and through the O
  // hole. One short word per letter, faded in as the camera reaches it.
  const woven: { mesh: TroikaText; a: number; b: number; bx: number; by: number; bz: number; fly?: { x: number; y: number; z: number } }[] = [];
  const addWoven = (
    str: string, font: string, size: number, color: number,
    x: number, y: number, z: number, a: number, b: number, ry = 0,
    fly?: { x: number; y: number; z: number },
  ) => {
    const tx = new TroikaText();
    tx.text = str;
    tx.font = font;
    tx.fontSize = size;
    tx.color = color;
    tx.anchorX = 'center';
    tx.anchorY = 'middle';
    tx.outlineWidth = size * 0.012;
    tx.outlineColor = 0x0a0908;
    tx.outlineBlur = size * 0.14; // soft coal halo for legibility, not a hard stroke
    tx.material.transparent = true;
    tx.position.set(x, y, z);
    tx.rotation.y = ry;
    tx.fillOpacity = 0;
    scene.add(tx);
    tx.sync();
    woven.push({ mesh: tx, a, b, bx: x, by: y, bz: z, fly });
  };
  // All behind-the-letter words share one style: off-white Cardo, whispered
  // context the letters occlude as the camera passes. The X word rides along
  // the letter (seen on the flip), then flies out as the roster appears.
  // Each word appears and flies clear BEFORE its letter's info text reads.
  addWoven('veterans', cardoUrl, 1.5, 0xe8e2dc, L[0], 0.4, 3, 0.10, 0.18, 0, { x: 0, y: 3, z: 6 }); // on approach, before the O identity
  addWoven('our roots', cardoUrl, 1.6, 0xe8e2dc, L[1], -0.4, -2.6, 0.37, 0.50); // behind N, before the N info
  addWoven('the robot', cardoUrl, 1.5, 0xe8e2dc, L[2], -1.6, 3.4, 0.61, 0.74); // in front of Y, before the Y info
  addWoven('our team', cardoUrl, 1.7, 0xe8e2dc, L[3], 0.2, -2.4, 0.81, 0.90, 0, { x: 0, y: 2.8, z: 7 }); // along X on the flip, flies clear before the roster

  // ---- Camera journey: a keyframe path threaded through the letters ---
  type KF = { t: number; px: number; py: number; pz: number; lx: number; ly: number; lz: number; roll: number };
  const KEYS: KF[] = [
    { t: 0.00, px: 0, py: 2.5, pz: 32, lx: 0, ly: 0, lz: 0, roll: 0 }, // overview (zoomed out, whole word)
    { t: 0.09, px: 0, py: 2.3, pz: 28, lx: 0, ly: 0, lz: 0, roll: 0 },
    { t: 0.14, px: L[0] - 1, py: 1.0, pz: 10, lx: L[0], ly: 0, lz: 0, roll: 0 }, // approach O, framed
    { t: 0.22, px: L[0] + 0.6, py: 0.6, pz: 7, lx: L[0], ly: 0, lz: 0, roll: 0 }, // O held (identity dwell)
    { t: 0.31, px: L[0], py: 0.2, pz: 2.4, lx: L[0], ly: 0, lz: -6, roll: 0 }, // enter the hole
    { t: 0.37, px: L[0], py: 0, pz: -1, lx: L[0], ly: 0, lz: -6.5, roll: 0 }, // through the hole (word flashes)
    { t: 0.42, px: L[1] - 5, py: 1.0, pz: -6.8, lx: L[1], ly: 0, lz: -0.5, roll: 0.16 }, // swing behind N
    { t: 0.49, px: L[1] - 6.6, py: 0.9, pz: -3.0, lx: L[1], ly: 0, lz: 0, roll: 0.3 }, // orbit N (clear of depth band)
    { t: 0.57, px: L[1], py: 0.8, pz: 9, lx: L[1], ly: 0, lz: 0, roll: 0 }, // front N
    { t: 0.66, px: L[2] - 4, py: 0.9, pz: -6.8, lx: L[2], ly: 0, lz: 0, roll: -0.2 }, // around Y
    { t: 0.72, px: L[2] + 6.2, py: 0.9, pz: -3.2, lx: L[2], ly: 0, lz: 0, roll: -0.32 }, // orbit Y (clear of depth band)
    { t: 0.80, px: L[2] + 1, py: 0.8, pz: 9, lx: L[2], ly: 0, lz: 0, roll: 0 }, // front Y
    { t: 0.87, px: L[3] - 5, py: 0.9, pz: -6, lx: L[3], ly: 0, lz: 0, roll: -0.2 }, // swing behind X
    { t: 0.93, px: L[3] + 1, py: 0.7, pz: 9.5, lx: L[3], ly: 0, lz: 0, roll: 0 }, // front X, team reads
    { t: 1.00, px: 0, py: 2.5, pz: 32, lx: 0, ly: 0, lz: 0, roll: 0 }, // pull back (bookends the overview)
  ];
  const evalKF = (p: number) => {
    let a = KEYS[0], b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (p >= KEYS[i].t && p <= KEYS[i + 1].t) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    }
    let u = (p - a.t) / (b.t - a.t || 1);
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    u = u * u * (3 - 2 * u); // smoothstep
    const lp = (x: number, y: number) => x + (y - x) * u;
    return { px: lp(a.px, b.px), py: lp(a.py, b.py), pz: lp(a.pz, b.pz), lx: lp(a.lx, b.lx), ly: lp(a.ly, b.ly), lz: lp(a.lz, b.lz), roll: lp(a.roll, b.roll) };
  };

  // Content dwell windows: the readable HTML for each letter reveals while the
  // camera holds on it (O framed through the hole; N/Y/X front; X close).
  const DWELL = [
    { a: 0.20, b: 0.31 }, // O identity, after 'veterans' has flown clear
    { a: 0.53, b: 0.63 },
    { a: 0.76, b: 0.83 },
    { a: 0.91, b: 0.98 }, // roster reads on front-X after 'our team' clears, then falls away as the camera pulls back
  ];
  const flowState = [false, false, false, false];

  let pointerX = 0, pointerY = 0; // -1..1
  let leanK = 1; // cursor-lean, fades once the journey starts
  let scrollVel = 0; // |scroll velocity|, drives ember turbulence
  let targetP = 0, scrollP = 0; // scroll progress, smoothed
  const clock = new THREE.Clock();
  let elapsed = 0;
  let alive = false; // idle breathing runs only after the assemble

  // Post: a low, tight bloom so only the brightest speculars and embers glow
  // (cinematic, not a wash). OutputPass applies tone mapping + colour space.
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (!LOWPERF) {
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.26, 0.5, 0.82));
  }
  composer.addPass(new OutputPass());

  function resize() {
    const w = stage.clientWidth || innerWidth;
    const h = stage.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', () => { resize(); ScrollTrigger.refresh(); }, { passive: true });

  // ---- Content flow (HTML overlay, readable + interactive) -----------
  const SHOWN = 'inset(-8% -8% -14% -8%)';
  const HID_BELOW = 'inset(100% -8% -14% -8%)';
  const HID_ABOVE = 'inset(-8% -8% 100% -8%)';
  const FLOW = [
    { ix: 0, iy: 34, ox: 0, oy: -46 },
    { ix: -58, iy: 52, ox: 80, oy: -66 },
    { ix: 0, iy: -50, ox: 0, oy: 62 },
    { ix: -60, iy: -44, ox: 78, oy: 54 },
  ];
  const allLines = groupsEl.flatMap((g) => gsap.utils.toArray<HTMLElement>('.flow-line', g));
  gsap.set(groupsEl, { opacity: 1, visibility: 'hidden' });
  gsap.set(allLines, { clipPath: HID_BELOW });
  const flowIn = (i: number) => {
    const ln = gsap.utils.toArray<HTMLElement>('.flow-line', groupsEl[i]);
    gsap.set(groupsEl[i], { visibility: 'visible' });
    gsap.fromTo(ln, { clipPath: HID_BELOW, x: FLOW[i].ix, y: FLOW[i].iy },
      { clipPath: SHOWN, x: 0, y: 0, ease: 'power3.out', duration: 0.85, stagger: 0.08, overwrite: true });
  };
  const flowOut = (i: number) => {
    const ln = gsap.utils.toArray<HTMLElement>('.flow-line', groupsEl[i]);
    gsap.to(ln, { clipPath: HID_ABOVE, x: FLOW[i].ox, y: FLOW[i].oy, ease: 'power2.in', duration: 0.4, stagger: 0.025, overwrite: true,
      onComplete: () => { if (!flowState[i]) gsap.set(groupsEl[i], { visibility: 'hidden' }); } });
  };

  // ---- Render loop ---------------------------------------------------
  const render = () => {
    const _t0 = (window as any).__onyxFrame ? performance.now() : 0; // perf probe (test only)
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    const t = elapsed;
    scrollP += (targetP - scrollP) * 0.16;
    (window as any).__onyxP = scrollP; // progress read-back (harmless; used by capture harness)
    const idleK = 1 - Math.min(1, scrollP / 0.06);

    if (alive) {
      // Idle: each letter breathes on its own axis; fades as the journey starts.
      for (let i = 0; i < meshes.length; i++) {
        const m = meshes[i];
        m.rotation.y = Math.sin(t * 0.5 + i * 1.3) * 0.09 * idleK;
        m.rotation.x = Math.sin(t * 0.42 + i * 0.7) * 0.05 * idleK;
        m.position.y = Math.sin(t * 0.6 + i * 1.1) * 0.12 * idleK;
      }
    }

    // Embers rise; sway and speed swell with scroll velocity.
    const speedMul = 1 + scrollVel * 6;
    for (let i = 0; i < EMBERS; i++) {
      const d = emberData[i], idx = i * 3;
      emberPos[idx] += d.sx * dt * speedMul + Math.sin(t * d.sway + d.phase) * d.swayR * dt * (1 + scrollVel * 3);
      emberPos[idx + 1] += d.sy * dt * speedMul;
      emberPos[idx + 2] += d.sz * dt * speedMul;
      if (emberPos[idx + 1] > 16 || Math.abs(emberPos[idx]) > 24) {
        emberPos[idx + 1] = -16;
        emberPos[idx] = (Math.random() - 0.5) * 34;
        emberPos[idx + 2] = (Math.random() - 0.5) * 24 - 4;
      }
    }
    emberGeo.attributes.position.needsUpdate = true;
    scrollVel *= 0.9;

    // Woven words fade in near their letter (triangle window, smoothed). A word
    // with a fly vector also drifts outward on its exit side, clearing the frame
    // as the letter's HTML takes over.
    for (const w of woven) {
      const mid = (w.a + w.b) / 2, half = (w.b - w.a) / 2 || 1;
      let k = Math.max(0, 1 - Math.abs(scrollP - mid) / half);
      k = k * k * (3 - 2 * k);
      w.mesh.fillOpacity = k;
      w.mesh.outlineOpacity = k;
      if (w.fly) {
        const exit = Math.max(0, Math.min(1, (scrollP - mid) / half)); // 0 at peak -> 1 at window end
        const e = exit * exit; // ease-in the launch
        w.mesh.position.set(w.bx + w.fly.x * e, w.by + w.fly.y * e, w.bz + w.fly.z * e);
      }
      if (k > 0.001) w.mesh.quaternion.copy(camera.quaternion); // billboard: always reads forward, never mirrored
    }

    // Content HTML reveals during its dwell window.
    for (let i = 0; i < DWELL.length; i++) {
      const inside = scrollP >= DWELL[i].a && scrollP <= DWELL[i].b;
      if (inside && !flowState[i]) { flowState[i] = true; flowIn(i); }
      else if (!inside && flowState[i]) { flowState[i] = false; flowOut(i); }
      // Safety net: a fast scroll can skip the flow-out; never let a letter's
      // copy linger well outside its window (guards the transit beats).
      else if (!inside && !flowState[i] && (scrollP < DWELL[i].a - 0.07 || scrollP > DWELL[i].b + 0.07)
        && groupsEl[i].style.visibility !== 'hidden') {
        gsap.set(groupsEl[i], { visibility: 'hidden' });
        gsap.set(gsap.utils.toArray<HTMLElement>('.flow-line', groupsEl[i]), { clipPath: HID_BELOW });
      }
    }

    // Camera from the keyframe path, with roll and a little cursor parallax.
    const s = evalKF(scrollP);
    const px = pointerX * leanK, py = pointerY * leanK;
    camera.up.set(Math.sin(s.roll), Math.cos(s.roll), 0);
    camera.position.set(s.px - px * 1.4, s.py + py * 0.9, s.pz);
    camera.lookAt(s.lx + px * 0.5, s.ly - py * 0.35, s.lz);
    composer.render();
    if (_t0) (window as any).__onyxFrame(performance.now() - _t0); // per-frame work cost (ms)
  };
  gsap.ticker.add(render);

  if (FINE) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointerY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    stage.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  }

  // ---- Assemble intro (once, at the top) -----------------------------
  const startAlive = () => { alive = true; };
  gsap.set(meshes, { visibility: 'visible' });
  if (scrollY < 12) {
    const intro = gsap.timeline({ delay: 0.2, onComplete: startAlive });
    meshes.forEach((m, i) => {
      const dir = i % 2 ? 1 : -1;
      intro.from(m.position, { x: m.position.x + dir * 9, y: (i - 1.5) * 4, z: -40, ease: 'expo.out', duration: 1.5 }, i * 0.12);
      intro.from(m.rotation, { y: dir * 1.4, x: 0.6, z: dir * 0.4, ease: 'expo.out', duration: 1.5 }, i * 0.12);
      intro.from(m.scale, { x: 0.4, y: 0.4, z: 0.4, ease: 'expo.out', duration: 1.5 }, i * 0.12);
    });
  } else {
    startAlive();
  }

  // ---- Scroll driver: pins the stage and feeds scroll progress --------
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=900%',
    pin: stage,
    scrub: 0.25,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      targetP = self.progress;
      leanK = 1 - Math.min(1, self.progress / 0.05);
      scrollVel = Math.min(3, Math.abs(self.getVelocity()) / 1400);
    },
  });

  document.documentElement.classList.add('onyx-live');
  ScrollTrigger.refresh();
}
