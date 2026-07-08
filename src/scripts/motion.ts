/**
 * motion — the site's motion engine.
 *
 * One GSAP + ScrollTrigger layer wired to Lenis so smooth scroll and
 * scroll-driven animation share a single clock. Everything is:
 *   - motivated (each effect communicates hierarchy, story, or feedback)
 *   - crisp and scroll-locked (clip-path wipes and masked rises, no fades)
 *   - reduced-motion safe (the module bows out; static CSS stands in)
 *   - transform / opacity / clip-path only (GPU, no layout thrash)
 *
 * Structure: generic primitives ([data-*] attributes) + named scenes that
 * only run when their element is on the page. See DESIGN.md.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Reveal everything immediately — the reduced-motion / failure path. */
function showEverything() {
  root.classList.remove('will-animate');
  document
    .querySelectorAll<HTMLElement>('[data-split],[data-reveal-scrub],[data-count]')
    .forEach((el) => (el.style.opacity = '1'));
}

if (REDUCED) {
  showEverything();
} else {
  try {
    boot();
  } catch (err) {
    showEverything();
  }
}

function boot() {
  root.classList.add('gsap');

  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  (window as any).__motion = { lenis, ScrollTrigger, gsap };

  const loading = root.classList.contains('loading');
  const startDelay = loading ? 950 : 60;
  if (loading) {
    try {
      sessionStorage.setItem('intro-seen', '1');
    } catch (e) {
      /* storage blocked */
    }
    setTimeout(() => root.classList.remove('loading'), 900);
  }

  const run = () => {
    try {
      // primitives
      initReveals();
      initScrubReveals();
      initSplits();
      initParallax();
      initCounters();
      if (FINE) {
        initMagnetic();
        initHoverPreview();
      }
      // scenes (each no-ops if its element is absent)
      initJourney();
      initHorizontalReveal();
      initHScroll();
      initFlip();
      initTierLadder();
      initProgress();
      initRoster(); // async (dynamic Swiper import)
      root.classList.add('motion-booted');
      root.classList.remove('will-animate');
      ScrollTrigger.refresh();
    } catch (err) {
      showEverything();
    }
  };

  const fontsReady = (document as any).fonts?.ready ?? new Promise((r) => setTimeout(r, 0));
  let started = false;
  const kick = () => {
    if (started) return;
    started = true;
    setTimeout(run, startDelay);
  };
  fontsReady.then(kick);
  setTimeout(kick, 1400);
  setTimeout(() => {
    if (!root.classList.contains('motion-booted')) showEverything();
  }, startDelay + 2800);

  // Re-split headings on width change so masked lines stay correct.
  let rz: number | undefined;
  addEventListener(
    'resize',
    () => {
      clearTimeout(rz);
      rz = window.setTimeout(() => {
        if (root.classList.contains('motion-booted')) {
          resplitAll();
          ScrollTrigger.refresh();
        }
      }, 250);
    },
    { passive: true }
  );
}

/* ================================================================== */
/* Split text into masked lines of characters.                        */
/* ================================================================== */
function splitToLines(el: HTMLElement): HTMLElement[] {
  const text = el.dataset.splitText ?? (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  el.dataset.splitText = text;
  el.setAttribute('aria-label', text);
  el.textContent = '';

  const words = text.split(' ').map((word) => {
    const w = document.createElement('span');
    w.className = 'split-word';
    w.setAttribute('aria-hidden', 'true');
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'split-char';
      c.textContent = ch;
      w.appendChild(c);
    }
    return w;
  });
  words.forEach((w, i) => {
    el.appendChild(w);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });

  const groups: HTMLElement[][] = [];
  let top: number | null = null;
  words.forEach((w) => {
    const t = w.offsetTop;
    if (top === null || Math.abs(t - top) > 4) {
      groups.push([]);
      top = t;
    }
    groups[groups.length - 1].push(w);
  });

  el.textContent = '';
  const chars: HTMLElement[] = [];
  groups.forEach((line) => {
    const wrap = document.createElement('span');
    wrap.className = 'split-line';
    wrap.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'split-line-inner';
    line.forEach((w, i) => {
      inner.appendChild(w);
      if (i < line.length - 1) inner.appendChild(document.createTextNode(' '));
      w.querySelectorAll<HTMLElement>('.split-char').forEach((c) => chars.push(c));
    });
    wrap.appendChild(inner);
    el.appendChild(wrap);
  });
  return chars;
}

function buildSplit(el: HTMLElement) {
  el.dataset.splitDone = '1';
  const chars = splitToLines(el);
  el.style.opacity = '1';
  gsap.set(chars, { yPercent: 115 });
  const tween = gsap.to(chars, {
    yPercent: 0,
    ease: 'power4.out',
    stagger: { each: 0.02, from: 'start' },
    scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 48%', scrub: 0.5 },
  });
  (el as any)._st = tween.scrollTrigger;
}

function initSplits() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    if (!el.dataset.splitDone) buildSplit(el);
  });
}

function resplitAll() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    (el as any)._st?.kill();
    delete el.dataset.splitDone;
    buildSplit(el);
  });
}

/* ================================================================== */
/* [data-reveal] — crisp clip-path wipes, opacity held at 1.          */
/* ================================================================== */
function initReveals() {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    const v = el.getAttribute('data-reveal') || 'up';
    const from: gsap.TweenVars = { opacity: 1 };
    if (v === 'up') {
      from.clipPath = 'inset(100% 0 0 0)';
      from.y = 22;
    } else if (v === 'left') {
      from.clipPath = 'inset(0 100% 0 0)';
      from.x = -26;
    } else if (v === 'right') {
      from.clipPath = 'inset(0 0 0 100%)';
      from.x = 26;
    } else if (v === 'scale') {
      from.clipPath = 'inset(100% 0 0 0)';
      from.scale = 0.94;
    }
    gsap.set(el, from);
    const delay = (parseFloat(el.dataset.revealDelay || '0') || 0) / 1000;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 86%',
      once: true,
      onEnter: () =>
        gsap.to(el, {
          clipPath: 'inset(0% 0 0% 0)',
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.9,
          delay,
          ease: 'power3.out',
          overwrite: 'auto',
        }),
    });
  });
}

/* [data-reveal-scrub] — the same wipe, but locked to scroll progress. */
function initScrubReveals() {
  gsap.utils.toArray<HTMLElement>('[data-reveal-scrub]').forEach((el) => {
    const v = el.getAttribute('data-reveal-scrub') || 'up';
    const hidden =
      v === 'left'
        ? 'inset(0 100% 0 0)'
        : v === 'right'
          ? 'inset(0 0 0 100%)'
          : 'inset(100% 0 0 0)';
    gsap.fromTo(
      el,
      { clipPath: hidden, opacity: 1 },
      {
        clipPath: 'inset(0% 0 0% 0)',
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 55%', scrub: 0.5 },
      }
    );
  });
}

/* ================================================================== */
/* [data-parallax="±px"] — depth via scrubbed y shift.                */
/* ================================================================== */
function initParallax() {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const s = parseFloat(el.dataset.parallax || '-60');
    gsap.fromTo(
      el,
      { y: -s },
      {
        y: s,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });
}

/* ================================================================== */
/* [data-count] — number counts up from 0 when it locks in.           */
/* ================================================================== */
function initCounters() {
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.countSuffix || '';
    el.style.opacity = '1';
    const obj = { n: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          n: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => (el.textContent = Math.round(obj.n) + suffix),
        }),
    });
  });
}

/* ================================================================== */
/* [data-magnetic] — CTAs lean toward the cursor (pointer-fine only).  */
/* ================================================================== */
function initMagnetic() {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic || '0.35');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* ================================================================== */
/* [data-hover-preview] — a row reveals its image beside the cursor.  */
/* Wrapper [data-preview-root] holds one shared floating <img>.        */
/* ================================================================== */
function initHoverPreview() {
  const rootEl = document.querySelector<HTMLElement>('[data-preview-root]');
  const img = rootEl?.querySelector<HTMLImageElement>('[data-preview-img]');
  if (!rootEl || !img) return;
  const xTo = gsap.quickTo(img, 'x', { duration: 0.5, ease: 'power3.out' });
  const yTo = gsap.quickTo(img, 'y', { duration: 0.5, ease: 'power3.out' });
  let raf = 0;
  rootEl.addEventListener('pointermove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = rootEl.getBoundingClientRect();
      xTo(e.clientX - r.left);
      yTo(e.clientY - r.top);
    });
  });
  rootEl.querySelectorAll<HTMLElement>('[data-hover-preview]').forEach((rowEl) => {
    rowEl.addEventListener('pointerenter', () => {
      const src = rowEl.dataset.hoverPreview;
      if (src) img.src = src;
      gsap.to(img, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
    });
    rowEl.addEventListener('pointerleave', () =>
      gsap.to(img, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: 'power2.out' })
    );
  });
}

/* ================================================================== */
/* SCENE: the immersive ONYX journey (home). The camera flies from the */
/* whole wordmark into each letter (O -> N -> Y -> X); each letter's    */
/* content panel wipes in when the camera arrives.                      */
/* ================================================================== */
function initJourney() {
  const journey = document.querySelector<HTMLElement>('.journey');
  const world = document.querySelector<HTMLElement>('[data-world]');
  if (!journey || !world) return;
  const letters = gsap.utils.toArray<HTMLElement>('.station-letter', world);
  const panels = gsap.utils.toArray<HTMLElement>('.panel');
  if (!letters.length) return;

  const S = 2.7; // zoom factor when a letter fills the frame
  gsap.set(world, { transformOrigin: '0 0', x: 0, y: 0, scale: 1, force3D: true });
  gsap.set(panels, { clipPath: 'inset(0 0 100% 0)', opacity: 1 });

  // Camera target to center letter i, measured from its untransformed
  // layout position (transform-origin 0 0 => screen = translate + scale*pos).
  const camFor = (i: number) => {
    const L = letters[i];
    const cx = L.offsetLeft + L.offsetWidth / 2;
    const cy = L.offsetTop + L.offsetHeight / 2;
    return { x: window.innerWidth / 2 - S * cx, y: window.innerHeight / 2 - S * cy };
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: journey,
      start: 'top top',
      end: '+=560%',
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  letters.forEach((_, i) => {
    tl.to(world, {
      x: () => camFor(i).x,
      y: () => camFor(i).y,
      scale: S,
      rotationY: i % 2 ? 5 : -5,
      ease: 'power2.inOut',
      duration: 1,
    });
    if (panels[i]) tl.to(panels[i], { clipPath: 'inset(0 0 0% 0)', ease: 'power3.out', duration: 0.4 }, '<0.45');
    tl.to({}, { duration: 0.9 }); // dwell
    if (i < letters.length - 1 && panels[i]) {
      tl.to(panels[i], { clipPath: 'inset(0 0 100% 0)', ease: 'power2.in', duration: 0.3 });
    }
  });
}

/* SCENE: horizontal text reveal (mission). [data-hreveal] chars wipe   */
/* brighter across on scrub. */
function initHorizontalReveal() {
  const el = document.querySelector<HTMLElement>('[data-hreveal]');
  if (!el) return;
  const chars = splitToLines(el);
  el.style.opacity = '1';
  gsap.set(chars, { opacity: 0.14 });
  gsap.to(chars, {
    opacity: 1,
    ease: 'none',
    stagger: 0.02,
    scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: 0.5 },
  });
}

/* SCENE: horizontal scroll-hijack (season build log). [data-hscroll]   */
/* pins and pans its [data-hscroll-track] sideways. */
function initHScroll() {
  const wrap = document.querySelector<HTMLElement>('[data-hscroll]');
  const track = wrap?.querySelector<HTMLElement>('[data-hscroll-track]');
  if (!wrap || !track) return;
  const distance = () => track.scrollWidth - window.innerWidth;
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: wrap,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });
}

/* SCENE: flip cards (season awards). [data-flip] turns in on enter.    */
function initFlip() {
  const cards = gsap.utils.toArray<HTMLElement>('[data-flip]');
  if (!cards.length) return;
  cards.forEach((card) => {
    gsap.set(card, { rotationY: -100, transformPerspective: 800, transformOrigin: '50% 50%' });
    ScrollTrigger.create({
      trigger: card,
      start: 'top 84%',
      once: true,
      onEnter: () =>
        gsap.to(card, {
          rotationY: 0,
          duration: 0.9,
          ease: 'power3.out',
          delay: (parseFloat(card.dataset.flipDelay || '0') || 0) / 1000,
        }),
    });
  });
}

/* SCENE: tier ladder (contact). [data-ladder] > [data-rung] lock in    */
/* one at a time on scrub via a left-to-right clip. */
function initTierLadder() {
  const ladder = document.querySelector<HTMLElement>('[data-ladder]');
  if (!ladder) return;
  gsap.utils.toArray<HTMLElement>('[data-rung]', ladder).forEach((r) => {
    gsap.fromTo(
      r,
      { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
      {
        clipPath: 'inset(0 0% 0 0)',
        ease: 'none',
        scrollTrigger: { trigger: r, start: 'top 88%', end: 'top 62%', scrub: 0.5 },
      }
    );
  });
}

/* SCENE: reading progress bar (blog post). [data-progress] fills.      */
function initProgress() {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const article = document.querySelector<HTMLElement>('article');
  if (!bar || !article) return;
  gsap.fromTo(
    bar,
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: 'none',
      transformOrigin: '0 0',
      scrollTrigger: { trigger: article, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    }
  );
}

/* SCENE: roster coverflow (home). [data-coverflow] via Swiper.         */
async function initRoster() {
  const el = document.querySelector<HTMLElement>('[data-coverflow]');
  if (!el) return;
  try {
    const [{ default: Swiper }, mods] = await Promise.all([
      import('swiper'),
      import('swiper/modules'),
    ]);
    await import('swiper/css');
    await import('swiper/css/effect-coverflow');
    new Swiper(el, {
      modules: [mods.EffectCoverflow, mods.Keyboard, mods.A11y],
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 'auto',
      loop: true,
      keyboard: { enabled: true },
      coverflowEffect: { rotate: 28, stretch: 0, depth: 160, modifier: 1, slideShadows: false },
    });
  } catch (e) {
    /* carousel degrades to a plain scrollable row if Swiper fails */
  }
}
