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
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GLYPHS } from '../data/onyx-glyphs';

gsap.registerPlugin(ScrollTrigger);

const CHARS = ['O', 'N', 'Y', 'X'] as const;
const GLYPH_SCALE = 0.01; // glyph em units -> world units
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

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
  const cue = document.querySelector<HTMLElement>('[data-onyx-cue]');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);

  // Custom onyx environment: a dark room lit only by palette-colored panels,
  // so the polished metal reflects crimson / purple / off-white glints — not
  // the neutral studio gray of RoomEnvironment (which read as cheap chrome).
  const envScene = new THREE.Scene();
  const panel = (color: number, intensity: number, x: number, y: number, z: number, w: number, h: number) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
    (mesh.material as THREE.MeshBasicMaterial).color.multiplyScalar(intensity);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
  };
  panel(0xe8e2dc, 3.6, -9, 8, 7, 18, 18); // off-white key, upper-left
  panel(0xc21a3c, 4.2, 12, 1, 5, 12, 14); // crimson, right
  panel(0x5a3578, 2.4, -6, -5, -9, 13, 13); // purple, lower-back
  panel(0x8a8088, 1.4, 0, 1, 13, 24, 24); // soft silver fill, front (metallic body sheen)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.05).texture;

  // Real polished onyx: a near-black metal. With metalness this high there is
  // almost no diffuse — the look is all reflection + sharp specular glint.
  const material = new THREE.MeshStandardMaterial({
    color: 0x4a4450, // dark gunmetal-purple: reflections read as silver, not black
    metalness: 0.9,
    roughness: 0.34,
    envMapIntensity: 1.25,
  });

  // Direct lights add sharp glints over the environment reflection.
  scene.add(new THREE.AmbientLight(0x140a18, 0.1));
  const key = new THREE.DirectionalLight(0xf1ece4, 1.5); key.position.set(-12, 11, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc21a3c, 2.6); rim.position.set(13, 1, 4); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x6a3f8f, 1.5); rim2.position.set(-10, 3, -6); scene.add(rim2);
  const fill = new THREE.DirectionalLight(0x241531, 0.6); fill.position.set(2, -12, 6); scene.add(fill);

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
  const EMBERS = 340;
  const emberData: { sx: number; sy: number; sz: number; sway: number; swayR: number; phase: number }[] = [];
  const emberPos = new Float32Array(EMBERS * 3);
  const emberCol = new Float32Array(EMBERS * 3);
  for (let i = 0; i < EMBERS; i++) {
    emberPos[i * 3] = (Math.random() - 0.5) * 42;
    emberPos[i * 3 + 1] = (Math.random() - 0.5) * 32;
    emberPos[i * 3 + 2] = (Math.random() - 0.5) * 26 - 4;
    if (Math.random() < 0.72) { emberCol[i * 3] = 0.78; emberCol[i * 3 + 1] = 0.1; emberCol[i * 3 + 2] = 0.18; }
    else { emberCol[i * 3] = 0.91; emberCol[i * 3 + 1] = 0.886; emberCol[i * 3 + 2] = 0.86; }
    emberData.push({ sx: (Math.random() - 0.5) * 0.6, sy: 0.3 + Math.random() * 0.7, sz: (Math.random() - 0.5) * 0.5, sway: 0.5 + Math.random() * 1.5, swayR: 0.08 + Math.random() * 0.22, phase: Math.random() * Math.PI * 2 });
  }
  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  emberGeo.setAttribute('color', new THREE.BufferAttribute(emberCol, 3));
  const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({
    size: 0.085, vertexColors: true, transparent: true, opacity: 0.8,
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
      depth: 240, bevelEnabled: true, bevelThickness: 18, bevelSize: 9, bevelSegments: 4, curveSegments: 12,
    });
    geo.scale(GLYPH_SCALE, -GLYPH_SCALE, GLYPH_SCALE); // flip y (glyph is y-down) -> upright
    geo.center();
    geo.computeVertexNormals();
    return geo;
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
    x += widths[i] / 2;
    m.position.x = x;
    letterX.push(x);
    x += widths[i] / 2 + gap;
    group.add(m);
    return m;
  });
  const centerX = 0;

  // ---- Camera framing ------------------------------------------------
  // A proxy holds the camera position + look target so the timeline can
  // interpolate both smoothly; the render loop applies it.
  const cam = { x: centerX, y: 3, z: 44, tx: centerX, ty: 0, tz: 0 };
  const OVERVIEW = { x: centerX, y: 3, z: 44, tx: centerX, ty: 0, tz: 0 };
  const focus = (i: number) => ({ x: letterX[i] + 3.4, y: 2.3, z: 14, tx: letterX[i], ty: 0, tz: 0.4 });

  let pointerX = 0, pointerY = 0; // -1..1
  let leanK = 1; // cursor-lean strength, fades as tracking begins
  let scrollVel = 0; // |scroll velocity|, drives ember turbulence
  const clock = new THREE.Clock();
  let elapsed = 0;
  let alive = false; // idle motion begins after the assemble

  function resize() {
    const w = stage.clientWidth || innerWidth;
    const h = stage.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', () => { resize(); ScrollTrigger.refresh(); }, { passive: true });

  // ---- Render loop ---------------------------------------------------
  const render = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    const t = elapsed;
    if (alive) {
      // Idle: each letter breathes on its own axis (real 3D turn + bob).
      for (let i = 0; i < meshes.length; i++) {
        const m = meshes[i];
        m.rotation.y = Math.sin(t * 0.5 + i * 1.3) * 0.09;
        m.rotation.x = Math.sin(t * 0.42 + i * 0.7) * 0.05;
        m.position.y = Math.sin(t * 0.6 + i * 1.1) * 0.12;
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
    scrollVel *= 0.9; // decay between scroll updates

    // Cursor parallax: nudge the camera opposite the pointer for depth.
    const px = pointerX * leanK, py = pointerY * leanK;
    camera.position.set(cam.x - px * 2.4, cam.y + py * 1.6, cam.z);
    camera.lookAt(cam.tx + px * 0.8, cam.ty - py * 0.5, cam.tz);
    renderer.render(scene, camera);
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

  // ---- Content flow (HTML overlay) -----------------------------------
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
    const tl = gsap.timeline();
    const ln = gsap.utils.toArray<HTMLElement>('.flow-line', groupsEl[i]);
    tl.set(groupsEl[i], { visibility: 'visible' });
    tl.fromTo(ln, { clipPath: HID_BELOW, x: FLOW[i].ix, y: FLOW[i].iy },
      { clipPath: SHOWN, x: 0, y: 0, ease: 'power3.out', duration: 0.85, stagger: 0.08 });
    return tl;
  };
  const flowOut = (i: number) => {
    const tl = gsap.timeline();
    const ln = gsap.utils.toArray<HTMLElement>('.flow-line', groupsEl[i]);
    tl.to(ln, { clipPath: HID_ABOVE, x: FLOW[i].ox, y: FLOW[i].oy, ease: 'power2.in', duration: 0.6, stagger: 0.05 });
    tl.set(groupsEl[i], { visibility: 'hidden' });
    return tl;
  };

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

  // ---- Scroll timeline: track across the word ------------------------
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=720%',
      pin: stage,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        leanK = 1 - Math.min(1, self.progress / 0.05);
        scrollVel = Math.min(3, Math.abs(self.getVelocity()) / 1400);
      },
    },
  });

  if (cue) tl.to(cue, { autoAlpha: 0, duration: 0.3 }, 0);

  groupsEl.forEach((_, i) => {
    const f = focus(i);
    tl.to(cam, { x: f.x, y: f.y, z: f.z, tx: f.tx, ty: f.ty, tz: f.tz, ease: 'power1.inOut', duration: 1.5 });
    tl.add(flowIn(i), '<0.55');
    tl.to({}, { duration: 0.95 });
    if (i < groupsEl.length - 1) tl.add(flowOut(i));
  });
  tl.to(cam, { x: OVERVIEW.x, y: OVERVIEW.y, z: OVERVIEW.z, tx: OVERVIEW.tx, ty: OVERVIEW.ty, tz: OVERVIEW.tz, ease: 'power1.inOut', duration: 1.6 });

  document.documentElement.classList.add('onyx-live');
  ScrollTrigger.refresh();
}
