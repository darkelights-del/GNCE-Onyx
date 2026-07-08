/**
 * motion — the site's motion engine.
 *
 * One GSAP + ScrollTrigger layer wired to Lenis so smooth scroll and
 * scroll-driven animation share a single clock. Design intent: crisp,
 * mechanical, scroll-locked motion. Reveals are clip-path wipes and
 * masked line/character rises, not opacity fades. The signature moments
 * (hero, roster) are pinned and scrubbed, so the reader drives them.
 *
 * Strictly progressive: the head sets html.will-animate synchronously so
 * first paint already hides what is about to move (no flash) and clears
 * it once this boots; a 2.6s failsafe + a try/catch reveal everything if
 * it never does. Under prefers-reduced-motion the module bows out and the
 * static CSS composition stands alone.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Reveal everything immediately — reduced-motion / failure path. */
function showEverything() {
  root.classList.remove('will-animate');
  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    el.style.opacity = '1';
  });
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

  // --- Lenis smooth scroll on the GSAP clock -----------------------
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  (window as any).__motion = { lenis, ScrollTrigger, gsap };

  // Intro cover (first visit) holds ~900ms; lift it, then start.
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
      assignGroupDelays();
      initReveals();
      initTextReveals();
      initParallax();
      initHero();
      initRoster();
      if (FINE) {
        initMagnetic();
        initHeroPointer();
      }
      root.classList.add('motion-booted');
      root.classList.remove('will-animate');
      ScrollTrigger.refresh();
    } catch (err) {
      showEverything();
    }
  };

  // Split measurements need real font metrics; wait for fonts, then the
  // intro beat. A hard cap keeps a slow swap from stalling boot.
  const fontsReady =
    (document as any).fonts?.ready ?? new Promise((r) => setTimeout(r, 0));
  let started = false;
  const kick = () => {
    if (started) return;
    started = true;
    setTimeout(run, startDelay);
  };
  fontsReady.then(kick);
  setTimeout(kick, 1200);

  setTimeout(() => {
    if (!root.classList.contains('motion-booted')) showEverything();
  }, startDelay + 2600);

  // Re-split headings on width change so masked lines stay correct.
  let rz: number | undefined;
  addEventListener(
    'resize',
    () => {
      clearTimeout(rz);
      rz = window.setTimeout(() => {
        if (!root.classList.contains('motion-booted')) return;
        resplitAll();
        ScrollTrigger.refresh();
      }, 250);
    },
    { passive: true }
  );
}

/* ------------------------------------------------------------------ */
/* Split text into masked lines of characters (no wrappers survive in  */
/* the a11y tree: aria-label on the element, aria-hidden on the parts).*/
/* ------------------------------------------------------------------ */
function splitToLines(el: HTMLElement): { chars: HTMLElement[]; lines: HTMLElement[] } {
  const text =
    el.dataset.splitText ?? (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  el.dataset.splitText = text;
  el.setAttribute('aria-label', text);
  el.textContent = '';

  // Lay words out flat first, measure their line by offsetTop.
  const wordEls = text.split(' ').map((word) => {
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
  wordEls.forEach((w, i) => {
    el.appendChild(w);
    if (i < wordEls.length - 1) el.appendChild(document.createTextNode(' '));
  });

  const groups: HTMLElement[][] = [];
  let top: number | null = null;
  wordEls.forEach((w) => {
    const t = w.offsetTop;
    if (top === null || Math.abs(t - top) > 4) {
      groups.push([]);
      top = t;
    }
    groups[groups.length - 1].push(w);
  });

  // Rebuild with a masked line wrapper per visual line.
  el.textContent = '';
  const chars: HTMLElement[] = [];
  const lines: HTMLElement[] = [];
  groups.forEach((words) => {
    const line = document.createElement('span');
    line.className = 'split-line';
    line.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'split-line-inner';
    words.forEach((w, i) => {
      inner.appendChild(w);
      if (i < words.length - 1) inner.appendChild(document.createTextNode(' '));
      w.querySelectorAll<HTMLElement>('.split-char').forEach((c) => chars.push(c));
    });
    line.appendChild(inner);
    el.appendChild(line);
    lines.push(inner);
  });
  return { chars, lines };
}

function resplitAll() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const st = (el as any)._splitST as ScrollTrigger | undefined;
    if (st) st.kill();
    delete el.dataset.splitDone;
    buildSplit(el);
  });
}

function buildSplit(el: HTMLElement) {
  el.dataset.splitDone = '1';
  const fromSide = el.dataset.split === 'side';
  const { chars } = splitToLines(el);
  el.style.opacity = '1';

  const fromVars: gsap.TweenVars = fromSide
    ? { xPercent: (i: number) => (i % 2 ? 60 : -60), yPercent: 40, opacity: 0 }
    : { yPercent: 115 };
  gsap.set(chars, fromVars);

  const tween = gsap.to(chars, {
    xPercent: 0,
    yPercent: 0,
    opacity: 1,
    ease: 'power4.out',
    stagger: { each: 0.02, from: fromSide ? 'random' : 'start' },
    scrollTrigger: {
      trigger: el,
      start: 'top 88%',
      end: 'top 46%',
      scrub: 0.5,
    },
  });
  (el as any)._splitST = tween.scrollTrigger;
}

/** [data-split] headings assemble, scroll-locked, from masked lines. */
function initTextReveals() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    if (el.dataset.splitDone) return;
    buildSplit(el);
  });
}

/** Auto-stagger reveals inside any [data-reveal-group]. */
function assignGroupDelays() {
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    group.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
      if (!el.style.getPropertyValue('--reveal-delay')) {
        el.style.setProperty('--reveal-delay', `${Math.min(i * 55, 330)}ms`);
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/* [data-reveal] — crisp clip-path wipes. Opacity stays 1: the mask does
   the reveal, so nothing cross-fades (no "ombre"). Directional.        */
/* ------------------------------------------------------------------ */
function initReveals() {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    const v = el.getAttribute('data-reveal') || 'up';
    // Force opaque up front (overrides the CSS fallback's opacity:0), so
    // the reveal is a pure wipe rather than a fade.
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
    } else if (v === 'clip') {
      const inner = el.querySelector<HTMLElement>('.reveal-clip-inner');
      if (inner) gsap.set(inner, { clipPath: 'inset(0 0 100% 0)' });
      from.y = 20;
    }
    gsap.set(el, from);

    const delay =
      (parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0) / 1000;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          clipPath: 'inset(0% 0 0% 0)',
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.95,
          delay,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        const inner = el.querySelector<HTMLElement>('.reveal-clip-inner');
        if (inner) {
          gsap.to(inner, {
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.05,
            delay,
            ease: 'power4.out',
          });
        }
        el.classList.add('is-revealed');
      },
    });
  });
}

/* ------------------------------------------------------------------ */
/* [data-parallax="±px"] — depth via a scrubbed y shift.               */
/* ------------------------------------------------------------------ */
function initParallax() {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const shift = parseFloat(el.dataset.parallax || '-60');
    gsap.fromTo(
      el,
      { y: -shift },
      {
        y: shift,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });
}

/* ------------------------------------------------------------------ */
/* The hero: a pinned scene making four teams into one.                */
/* ------------------------------------------------------------------ */
function initHero() {
  const scene = document.querySelector<HTMLElement>('.hero-scene');
  const stage = document.querySelector<HTMLElement>('.hero-stage');
  if (!scene || !stage) return;

  const numbers = gsap.utils.toArray<HTMLElement>('.hero-number');
  const headA = stage.querySelector<HTMLElement>('.hero-head-a');
  const headB = stage.querySelector<HTMLElement>('.hero-head-b');
  const eyebrow = stage.querySelector<HTMLElement>('.hero-eyebrow');
  const tail = stage.querySelector<HTMLElement>('.hero-tail');
  const cue = stage.querySelector<HTMLElement>('.hero-cue');
  const ember = stage.querySelector<HTMLElement>('.hero-ember');

  if (headA) headA.style.display = 'block';
  const aChars = headA ? splitToLines(headA).chars : [];
  const bChars = headB ? splitToLines(headB).chars : [];
  if (headB) headB.style.opacity = '1';

  const w = () => window.innerWidth;
  const h = () => window.innerHeight;

  // --- Load intro (plays as the cover lifts) -----------------------
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  if (eyebrow) intro.from(eyebrow, { yPercent: 130, opacity: 0, duration: 0.7 }, 0);
  intro.from(
    numbers,
    {
      x: (i: number) => (i % 2 === 0 ? -1 : 1) * w() * 0.34,
      y: (i: number) => (i < 2 ? -1 : 1) * h() * 0.3,
      rotate: (i: number) => (i % 2 === 0 ? -1 : 1) * 28,
      opacity: 0,
      scale: 0.4,
      duration: 1.3,
      stagger: 0.09,
    },
    0.05
  );
  intro.from(aChars, { yPercent: 120, duration: 1, stagger: 0.035 }, 0.2);
  if (tail) intro.from(tail, { y: 26, opacity: 0, duration: 0.8 }, 0.55);
  if (cue) intro.from(cue, { opacity: 0, y: 14, duration: 0.6 }, 0.95);

  // --- Scroll-scrubbed merge (pinned) ------------------------------
  const scrub = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: 'top top',
      end: '+=210%',
      scrub: 0.6,
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
    },
  });

  scrub.to(
    numbers,
    { y: '-=90', opacity: 0, scale: 0.62, ease: 'power1.in', stagger: 0.03, duration: 0.4 },
    0
  );
  if (ember) {
    scrub.fromTo(
      ember,
      { scale: 0.55, opacity: 0.45 },
      { scale: 1.15, opacity: 1, ease: 'sine.inOut', duration: 0.72 },
      0.14
    );
  }
  if (aChars.length) {
    scrub.to(
      aChars,
      { yPercent: -170, opacity: 0, rotateX: 90, stagger: 0.012, ease: 'power3.in', duration: 0.26 },
      0.24
    );
  }
  if (bChars.length) {
    gsap.set(bChars, { yPercent: 120, opacity: 0 });
    scrub.to(
      bChars,
      {
        yPercent: 0,
        opacity: 1,
        stagger: { each: 0.03, from: 'center' },
        ease: 'back.out(1.7)',
        duration: 0.42,
      },
      0.42
    );
  }
  if (cue) scrub.to(cue, { opacity: 0, duration: 0.14 }, 0);
}

/* ------------------------------------------------------------------ */
/* The roster: a pinned scene where members fly in from the sides.     */
/* ------------------------------------------------------------------ */
function initRoster() {
  const scene = document.querySelector<HTMLElement>('[data-scene="roster"]');
  if (!scene) return;
  const items = gsap.utils.toArray<HTMLElement>('[data-roster-item]', scene);
  if (!items.length) return;

  gsap.set(items, {
    xPercent: (i) => (i % 2 ? 1 : -1) * 115,
    opacity: 0,
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: 'top top',
      end: `+=${Math.max(items.length * 42, 140)}%`,
      scrub: 0.5,
      pin: true,
      anticipatePin: 1,
    },
  });
  tl.to(items, {
    xPercent: 0,
    opacity: 1,
    ease: 'power3.out',
    stagger: 0.5,
    duration: 1,
  });
}

/* ------------------------------------------------------------------ */
/* Magnetic pull — CTAs lean toward the cursor (pointer-fine only).    */
/* ------------------------------------------------------------------ */
function initMagnetic() {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic || '0.4');
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

/* ------------------------------------------------------------------ */
/* Hero pointer field — the scattered numbers drift with the cursor.   */
/* ------------------------------------------------------------------ */
function initHeroPointer() {
  const stage = document.querySelector<HTMLElement>('.hero-stage');
  const field = document.querySelector<HTMLElement>('.hero-numbers');
  if (!stage || !field) return;
  const xTo = gsap.quickTo(field, 'x', { duration: 0.9, ease: 'power3.out' });
  const yTo = gsap.quickTo(field, 'y', { duration: 0.9, ease: 'power3.out' });
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    xTo(((e.clientX - (r.left + r.width / 2)) / r.width) * 26);
    yTo(((e.clientY - (r.top + r.height / 2)) / r.height) * 26);
  });
  stage.addEventListener('pointerleave', () => {
    xTo(0);
    yTo(0);
  });
}
