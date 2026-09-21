// The hands illustration comes alive: gold dust streams along the loop, the objects ride it,
// and the two hands pass tokens to each other. Hands also close in as the section scrolls in.
import { WIDE_PATH, TALL_PATH, WIDE_OBJECTS } from "./ring-data.js";

const TAU = Math.PI * 2;
const DUST_COLORS = ["#EA580C", "#C2410C", "#FDBA74", "#C2410C", "#FED7AA", "#9A3412"];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function loop(points) {
  const n = points.length;
  const at = (t) => {
    t = ((t % 1) + 1) % 1;
    const f = t * n;
    const i = Math.floor(f);
    const u = f - i;
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u);
    return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
  };
  const normal = (t) => {
    const a = at(t - 0.002), b = at(t + 0.002);
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  };
  return { at, normal };
}

function gauss() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

// Tall layout reuses a few small objects from the wide set
const TALL_OBJECTS = [
  { src: "ring-07.webp", w: 5.2, t: 0.02 }, { src: "ring-14.webp", w: 4.8, t: 0.18 },
  { src: "ring-02.webp", w: 9, t: 0.33 }, { src: "ring-15.webp", w: 3.6, t: 0.5 },
  { src: "ring-09.webp", w: 3.2, t: 0.64 }, { src: "ring-06.webp", w: 8, t: 0.8 },
  { src: "ring-11.webp", w: 5, t: 0.9 },
];
const SPINNERS = new Set(["ring-01.webp", "ring-02.webp", "ring-04.webp", "ring-06.webp"]);

function mount(root, { reduced }) {
  const tall = root.dataset.ring === "tall";
  const path = loop(tall ? TALL_PATH : WIDE_PATH);
  const canvas = root.querySelector(".ring-canvas");
  const ctx = canvas.getContext("2d");
  const layer = root.querySelector(".ring-objects");
  const red = root.querySelector(".hand--red");
  const purple = root.querySelector(".hand--purple");
  const band = tall ? 7 : 6.5;

  // Dust particles riding the loop
  const count = tall ? 520 : 1100;
  const dust = Array.from({ length: count }, () => ({
    t: Math.random(),
    off: gauss() * band,
    speed: (0.004 + Math.random() * 0.01) * (Math.random() < 0.15 ? 2.2 : 1),
    size: Math.random() < 0.08 ? 2.6 + Math.random() * 1.8 : 0.8 + Math.random() * 1.6,
    color: DUST_COLORS[(Math.random() * DUST_COLORS.length) | 0],
    phase: Math.random() * TAU,
  }));

  // Objects: keep each one's offset from the loop so the start matches the illustration
  const defs = tall ? TALL_OBJECTS : WIDE_OBJECTS;
  const objects = defs.map((d, i) => {
    const img = document.createElement("img");
    img.src = `/assets/img/objects/${d.src}`;
    img.alt = "";
    img.decoding = "async";
    img.className = "ring-object";
    img.style.width = `${d.w * (tall ? 1 : 1.15)}%`;
    layer.append(img);
    const base = path.at(d.t);
    const off = tall ? [0, 0] : [d.x - base[0], d.y - base[1]];
    return { img, t: d.t, off, spin: SPINNERS.has(d.src), phase: i * 1.7, depth: 0.6 + (d.w / 8) };
  });

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    const r = root.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  };
  resize();
  new ResizeObserver(resize).observe(root);

  let progress = 1;
  const measure = () => {
    const r = root.getBoundingClientRect();
    const vh = window.innerHeight;
    progress = clamp((vh - r.top) / (vh * 0.85));
  };

  const draw = (time) => {
    const s = time / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const p of dust) {
      if (!reduced) p.t -= p.speed / 60;
      const [x, y] = path.at(p.t);
      const [nx, ny] = path.normal(p.t);
      const wob = Math.sin(s * 1.3 + p.phase) * 0.6;
      const px = ((x + nx * (p.off + wob)) / 100) * W;
      const py = ((y + ny * (p.off + wob)) / 100) * H;
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(s * 2 + p.phase);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const drift = reduced ? 0 : s * 0.012;
    for (const o of objects) {
      const t = o.t - drift;
      const [x, y] = path.at(t);
      const bob = reduced ? 0 : Math.sin(s * 1.1 + o.phase) * 1.2;
      const rot = reduced ? 0 : Math.sin(s * 0.8 + o.phase) * 14;
      const flip = o.spin && !reduced ? 0.55 + 0.45 * Math.abs(Math.cos(s * 1.4 + o.phase)) : 1;
      o.img.style.left = `${x + o.off[0]}%`;
      o.img.style.top = `${y + o.off[1] + bob}%`;
      o.img.style.transform = `translate(-50%, -50%) rotate(${rot.toFixed(1)}deg) scaleX(${flip.toFixed(3)})`;
    }

    if (red && purple) {
      const k = reduced ? 0 : 1;
      const idle = Math.sin(s * 1.2) * k;
      const away = 1 - progress;
      red.style.transform = `translate(${(-14 * away + 2 * idle).toFixed(2)}%, ${(10 * away - 6 * idle).toFixed(2)}%) rotate(${(8 * away - 4 * idle).toFixed(2)}deg)`;
      purple.style.transform = `translate(${(14 * away - 2 * idle).toFixed(2)}%, ${(-10 * away + 7 * idle).toFixed(2)}%) rotate(${(-8 * away + 4 * idle).toFixed(2)}deg)`;
    }
  };

  if (reduced) {
    progress = 1;
    draw(0);
    new ResizeObserver(() => draw(0)).observe(root);
    return;
  }

  let running = false;
  let frame = 0;
  const tick = (time) => {
    if (!running) return;
    measure();
    draw(time);
    frame = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      frame = requestAnimationFrame(tick);
    } else if (!entry.isIntersecting) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }, { rootMargin: "120px 0px" }).observe(root);
}

export function initRing({ reduced }) {
  document.querySelectorAll("[data-ring]").forEach((root) => mount(root, { reduced }));
}
