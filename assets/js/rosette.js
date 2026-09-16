// Guilloché rosette, the security linework found on passports and banknotes.
// Each ring is a family of closed curves whose radius is modulated by two sine waves.
// Shifting the phase of every curve weaves the moiré pattern.

const HERO_RINGS = [
  { r: 0.9, a1: 0.035, k1: 24, a2: 0.012, k2: 6, count: 40, speed: 0.035, alpha: 0.2 },
  { r: 0.7, a1: 0.07, k1: 16, a2: 0.02, k2: 5, count: 34, speed: -0.05, alpha: 0.26 },
  { r: 0.48, a1: 0.12, k1: 10, a2: 0.03, k2: 3, count: 28, speed: 0.07, alpha: 0.32 },
  { r: 0.26, a1: 0.26, k1: 7, a2: 0.04, k2: 2, count: 20, speed: -0.09, alpha: 0.4 }
];

const CARD_RINGS = [
  { r: 0.88, a1: 0.05, k1: 20, a2: 0.015, k2: 5, count: 30, speed: 0, alpha: 0.13 },
  { r: 0.6, a1: 0.1, k1: 12, a2: 0.03, k2: 4, count: 24, speed: 0, alpha: 0.15 },
  { r: 0.32, a1: 0.22, k1: 8, a2: 0.04, k2: 3, count: 18, speed: 0, alpha: 0.18 }
];

const TAU = Math.PI * 2;

function draw(ctx, size, rings, { time = 0, steps, rgb, breathe = 0, offsetX = 0, offsetY = 0 }) {
  const half = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(half + offsetX, half + offsetY);
  ctx.lineWidth = 0.6;

  for (const ring of rings) {
    const base = half * ring.r;
    const amp1 = half * ring.a1 * (1 + breathe);
    const amp2 = half * ring.a2;
    ctx.strokeStyle = `rgb(${rgb} / ${ring.alpha})`;

    for (let j = 0; j < ring.count; j++) {
      const phase = (j / ring.count) * TAU + time * ring.speed;
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * TAU;
        const radius = base + amp1 * Math.sin(ring.k1 * theta + phase) + amp2 * Math.sin(ring.k2 * theta - phase * 0.5);
        const x = radius * Math.cos(theta);
        const y = radius * Math.sin(theta);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = Math.round(canvas.getBoundingClientRect().width);
  if (!size) return null;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, size };
}

export function mountHeroRosette(canvas, { reduced }) {
  const compact = window.matchMedia("(max-width: 767px)").matches;
  const rings = compact ? HERO_RINGS.map((ring) => ({ ...ring, count: Math.round(ring.count * 0.6) })) : HERO_RINGS;
  const steps = compact ? 320 : 540;
  const rgb = "212 178 114";
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  let surface = fitCanvas(canvas);
  let running = false;
  let frame = 0;
  let last = 0;
  const start = performance.now();

  const render = (now) => {
    if (!surface) return;
    const t = (now - start) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    draw(surface.ctx, surface.size, rings, {
      time: t,
      steps,
      rgb,
      breathe: 0.18 * Math.sin(t * 0.35),
      offsetX: pointer.x * surface.size * 0.02,
      offsetY: pointer.y * surface.size * 0.02
    });
  };

  // 30fps is plenty for slow linework and halves the cost
  const loop = (now) => {
    if (!running) return;
    if (now - last >= 33) {
      last = now;
      render(now);
    }
    frame = requestAnimationFrame(loop);
  };

  const play = () => {
    if (running || reduced) return;
    running = true;
    frame = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  render(start + 4000);

  new ResizeObserver(() => {
    surface = fitCanvas(canvas);
    render(performance.now());
  }).observe(canvas);

  new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause())).observe(canvas);

  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : play()));

  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
      pointer.tx = event.clientX / window.innerWidth - 0.5;
      pointer.ty = event.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }
}

export function mountStaticRosette(canvas) {
  const paint = () => {
    const surface = fitCanvas(canvas);
    if (surface) draw(surface.ctx, surface.size, CARD_RINGS, { steps: 420, rgb: "127 95 39" });
  };
  new ResizeObserver(paint).observe(canvas);
}
