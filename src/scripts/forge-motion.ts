/**
 * forge-motion — the site's motion engine.
 *
 * One GSAP + ScrollTrigger layer, wired to Lenis so smooth scroll and
 * scroll-driven animation share a single clock. It owns:
 *   - the pinned hero scene (numbers fly in and converge, "Four teams."
 *     yields to "One Onyx." struck letter by letter, ember swells)
 *   - split-text fly-ins on [data-split] headings
 *   - depth parallax on [data-parallax]
 *   - magnetic pull on [data-magnetic] and a pointer-reactive hero field
 *   - the supporting [data-reveal] entrances
 *
 * Everything is gated: under `prefers-reduced-motion` or without JS the
 * module bows out and the static CSS composition stands on its own. The
 * head sets html.will-animate synchronously so first paint already hides
 * what is about to move (no flash), with a 2.5s failsafe that reveals
 * everything if this module never boots.
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
  const lenis = new Lenis({ lerp: 0.11, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Test/debug handle: drive scroll deterministically from tooling.
  (window as any).__forge = { lenis, ScrollTrigger, gsap };

  // The loader (first visit) holds ~900ms; lift it, then start the intro
  // so the hero entrance reads as the cover's exit.
  const loading = root.classList.contains('loading');
  const startDelay = loading ? 950 : 60;
  if (loading) {
    try {
      sessionStorage.setItem('forged', '1');
    } catch (e) {
      /* storage blocked */
    }
    setTimeout(() => root.classList.remove('loading'), 900);
  }

  const run = () => {
    try {
      assignGroupDelays();
      initReveals();
      initSplits();
      initParallax();
      initHero();
      if (FINE) {
        initMagnetic();
        initHeroPointer();
      }
      root.classList.add('motion-booted');
      root.classList.remove('will-animate');
      ScrollTrigger.refresh();
    } catch (err) {
      // Never trap content behind a broken animation.
      showEverything();
    }
  };

  // Split measurements need the real faces; wait for fonts, then the
  // loader beat. A hard cap keeps a slow font swap from stalling boot.
  const fontsReady =
    (document as any).fonts?.ready ??
    new Promise((r) => setTimeout(r, 0));
  let started = false;
  const kick = () => {
    if (started) return;
    started = true;
    setTimeout(run, startDelay);
  };
  fontsReady.then(kick);
  setTimeout(kick, 1200);

  // Absolute failsafe: if boot never completes, reveal the page.
  setTimeout(() => {
    if (!root.classList.contains('motion-booted')) showEverything();
  }, startDelay + 2600);
}

/* ------------------------------------------------------------------ */
/* Split text: wrap each character in its own span, keep it readable.  */
/* ------------------------------------------------------------------ */
function splitChars(el: HTMLElement): HTMLElement[] {
  const source = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  el.setAttribute('aria-label', source);
  el.textContent = '';
  const chars: HTMLElement[] = [];
  source.split(' ').forEach((word, wi, arr) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'split-word';
    wordEl.setAttribute('aria-hidden', 'true');
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'split-char';
      c.textContent = ch;
      wordEl.appendChild(c);
      chars.push(c);
    }
    el.appendChild(wordEl);
    if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return chars;
}

/* ------------------------------------------------------------------ */
/* [data-split] — headings assemble per character on scroll in.        */
/* ------------------------------------------------------------------ */
function initSplits() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    const chars = splitChars(el);
    el.style.opacity = '1';
    gsap.set(chars, { yPercent: 120, opacity: 0, rotateX: -90 });
    gsap.to(chars, {
      yPercent: 0,
      opacity: 1,
      rotateX: 0,
      duration: 0.9,
      ease: 'power4.out',
      stagger: { each: 0.028, from: 'start' },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

/** Auto-stagger reveals inside any [data-reveal-group] (60ms apart). */
function assignGroupDelays() {
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    group.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
      if (!el.style.getPropertyValue('--reveal-delay')) {
        el.style.setProperty('--reveal-delay', `${Math.min(i * 60, 360)}ms`);
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/* [data-reveal] — the supporting cast: copy, cards, rows.             */
/* ------------------------------------------------------------------ */
function initReveals() {
  const els = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  els.forEach((el) => {
    const v = el.getAttribute('data-reveal') || 'up';
    const from: gsap.TweenVars = { opacity: 0 };
    if (v === 'up') from.y = 46;
    else if (v === 'left') from.x = -46;
    else if (v === 'right') from.x = 46;
    else if (v === 'scale') from.scale = 0.94;
    else if (v === 'clip') {
      from.y = 30;
      const inner = el.querySelector<HTMLElement>('.reveal-clip-inner');
      if (inner) gsap.set(inner, { clipPath: 'inset(0 0 100% 0)' });
    }
    gsap.set(el, from);

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        const delay =
          (parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0) / 1000;
        gsap.to(el, {
          opacity: 1,
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
/* [data-parallax] — depth. data-parallax="-80" shifts y across scroll.*/
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
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

/* ------------------------------------------------------------------ */
/* The hero: a pinned scene forging four teams into one.               */
/* ------------------------------------------------------------------ */
function initHero() {
  const track = document.querySelector<HTMLElement>('.forge-track');
  const stage = document.querySelector<HTMLElement>('.forge-stage');
  if (!track || !stage) return;

  const numbers = gsap.utils.toArray<HTMLElement>('.fs-number');
  const headA = stage.querySelector<HTMLElement>('.fs-head-a');
  const headB = stage.querySelector<HTMLElement>('.fs-head-b');
  const eyebrow = stage.querySelector<HTMLElement>('.fs-eyebrow');
  const tail = stage.querySelector<HTMLElement>('.fs-tail');
  const cue = stage.querySelector<HTMLElement>('.fs-cue');
  const ember = stage.querySelector<HTMLElement>('.fs-ember');

  // Reveal the layers the head pre-hid, now that we own their motion.
  if (headA) headA.style.display = 'block';
  const aChars = headA ? splitChars(headA) : [];
  const bChars = headB ? splitChars(headB) : [];
  if (headB) headB.style.opacity = '1';

  // Numbers rest at their CSS corners (left/top); GSAP only offsets them
  // via transform, so the resting scatter stays resize-correct.
  const w = () => window.innerWidth;
  const h = () => window.innerHeight;

  // --- Load intro (timed, plays as the loader lifts) ---------------
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  if (eyebrow) intro.from(eyebrow, { yPercent: 120, opacity: 0, duration: 0.7 }, 0);
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
  intro.from(
    aChars,
    { yPercent: 130, opacity: 0, rotateX: -80, duration: 1, stagger: 0.035 },
    0.2
  );
  if (tail) intro.from(tail, { y: 26, opacity: 0, duration: 0.8 }, 0.55);
  if (cue) intro.from(cue, { opacity: 0, y: 14, duration: 0.6 }, 0.95);

  // --- Scroll-scrubbed merge (pinned) ------------------------------
  const scrub = gsap.timeline({
    scrollTrigger: {
      trigger: track,
      start: 'top top',
      end: '+=210%',
      scrub: 0.6,
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
    },
  });

  // As the merge completes, the numbers lift and fade like sparks.
  scrub.to(
    numbers,
    {
      y: '-=90',
      opacity: 0,
      scale: 0.62,
      ease: 'power1.in',
      stagger: 0.03,
      duration: 0.4,
    },
    0
  );

  // Ember swells as the merge completes.
  if (ember) {
    scrub.fromTo(
      ember,
      { scale: 0.55, opacity: 0.45 },
      { scale: 1.15, opacity: 1, ease: 'sine.inOut', duration: 0.72 },
      0.14
    );
  }

  // "Four teams." blows apart upward.
  if (aChars.length) {
    scrub.to(
      aChars,
      {
        yPercent: -170,
        opacity: 0,
        rotateX: 90,
        stagger: 0.012,
        ease: 'power3.in',
        duration: 0.26,
      },
      0.24
    );
  }

  // "One Onyx." is struck in, letter by letter, from the center out.
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

  // The scroll cue fades the moment the merge begins.
  if (cue) scrub.to(cue, { opacity: 0, duration: 0.14 }, 0);
}

/* ------------------------------------------------------------------ */
/* Magnetic pull — buttons and the gear lean toward the cursor.        */
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
  const stage = document.querySelector<HTMLElement>('.forge-stage');
  const field = document.querySelector<HTMLElement>('.fs-numbers');
  if (!stage || !field) return;
  const xTo = gsap.quickTo(field, 'x', { duration: 0.9, ease: 'power3.out' });
  const yTo = gsap.quickTo(field, 'y', { duration: 0.9, ease: 'power3.out' });
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    xTo(dx * 26);
    yTo(dy * 26);
  });
  stage.addEventListener('pointerleave', () => {
    xTo(0);
    yTo(0);
  });
}
