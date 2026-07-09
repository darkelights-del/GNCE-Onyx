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
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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
  renderer.toneMappingExposure = 0.66;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);

  // Faint image-based lighting for a subtle sheen (not a chrome mirror).
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

  // Onyx: deep-purple body, low-ish gloss, almost no reflection. Character
  // comes from the raking colored lights.
  const material = new THREE.MeshStandardMaterial({
    color: 0x1c1228,
    metalness: 0.22,
    roughness: 0.56,
    envMapIntensity: 0.05,
  });

  // Grazing key so the flat faces stay dark (text reads over them) while the
  // bevels catch off-white / crimson / purple.
  scene.add(new THREE.AmbientLight(0x140a18, 0.22));
  const key = new THREE.DirectionalLight(0xd8cfc8, 0.46); key.position.set(-14, 10, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xb01636, 3.2); rim.position.set(12, 1, 5); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x5a2f7a, 2.0); rim2.position.set(-11, 3, 2); scene.add(rim2);
  const back = new THREE.DirectionalLight(0x6e0d25, 2.6); back.position.set(8, -2, -10); scene.add(back);
  const fill = new THREE.DirectionalLight(0x241531, 0.7); fill.position.set(2, -12, 6); scene.add(fill);

  // ---- Build the letters from the Uncial outlines --------------------
  function buildGeometry(d: string) {
    const parsed = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
    const shapes: THREE.Shape[] = [];
    for (const p of parsed.paths) shapes.push(...SVGLoader.createShapes(p));
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 240, bevelEnabled: true, bevelThickness: 34, bevelSize: 20, bevelSegments: 5, curveSegments: 14,
    });
    geo.scale(GLYPH_SCALE, -GLYPH_SCALE, GLYPH_SCALE); // flip y (glyph is y-down) -> upright
    geo.center();
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
  const clock = new THREE.Clock();
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
    const t = clock.getElapsedTime();
    if (alive) {
      // Idle: each letter breathes on its own axis (real 3D turn + bob).
      for (let i = 0; i < meshes.length; i++) {
        const m = meshes[i];
        m.rotation.y = Math.sin(t * 0.5 + i * 1.3) * 0.09;
        m.rotation.x = Math.sin(t * 0.42 + i * 0.7) * 0.05;
        m.position.y = Math.sin(t * 0.6 + i * 1.1) * 0.12;
      }
    }
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
      onUpdate: (self) => { leanK = 1 - Math.min(1, self.progress / 0.05); },
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
