// Hero immersion: rivers of gold dust sweep across the whole hero, illustration objects float
// at different depths, everything leans with the pointer and drifts on scroll.
const TAU = Math.PI * 2;
const DUST_COLORS = ["#FFE45C", "#F6D04D", "#FFF3A6", "#F2C230", "#FFD84A", "#FFFFFF"];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Dust rivers as cubic curves in hero space (0..1). Wide and tall screens get their own flow.
const RIVERS = {
  wide: [
    { p: [[-0.05, 1.04], [0.28, 0.8], [0.5, 1.1], [0.74, 0.7]], width: 0.06, share: 0.24 },
    { p: [[0.52, 0.08], [0.72, -0.08], [1.02, 0.12], [0.98, 0.52]], width: 0.06, share: 0.16 },
    { p: [[0.98, 0.52], [0.95, 0.95], [0.66, 1.05], [0.56, 0.78]], width: 0.06, share: 0.16 },
    { p: [[0.56, 0.78], [0.44, 0.52], [0.5, 0.2], [0.52, 0.08]], width: 0.05, share: 0.14 },
    { p: [[-0.04, 0.08], [0.12, 0.02], [0.3, 0.06], [0.46, -0.03]], width: 0.04, share: 0.08 },
  ],
  tall: [
    { p: [[-0.1, 0.74], [0.3, 0.64], [0.7, 0.86], [1.1, 0.7]], width: 0.045, share: 0.28 },
    { p: [[1.1, 0.84], [0.8, 1.02], [0.3, 0.92], [-0.1, 1.02]], width: 0.045, share: 0.28 },
    { p: [[-0.05, 0.03], [0.3, -0.01], [0.7, 0.05], [1.05, 0.0]], width: 0.022, share: 0.08 },
  ],
};

// Floating objects: x, y in percent of the hero, w in px at 1440 wide, z is depth (bigger is closer)
const OBJECTS = {
  wide: [
    { src: "objects/ring-00.webp", x: 93, y: 13, w: 118, z: 0.9, r: 12 },
    { src: "objects/ring-01.webp", x: 56, y: 86, w: 86, z: 1.1, r: -10 },
    { src: "objects/ring-02.webp", x: 50, y: 12, w: 70, z: 0.6, r: 8 },
    { src: "objects/ring-03.webp", x: 5, y: 97, w: 96, z: 1.2, r: -6 },
    { src: "objects/ring-04.webp", x: 97, y: 74, w: 78, z: 0.7, r: 10 },
    { src: "objects/card-01.webp", x: 53, y: 55, w: 46, z: 0.5, r: 0 },
    { src: "objects/card-03.webp", x: 88, y: 93, w: 52, z: 1.0, r: 0 },
    { src: "objects/card-02.webp", x: 62, y: 26, w: 40, z: 0.4, r: 14 },
    { src: "objects/ring-08.webp", x: 44, y: 74, w: 30, z: 0.45, r: -18 },
    { src: "objects/ring-07.webp", x: 74, y: 7, w: 34, z: 0.8, r: 20 },
    { src: "objects/ring-15.webp", x: 2, y: 48, w: 28, z: 0.5, r: 0 },
    { src: "objects/ring-14.webp", x: 36, y: 6, w: 30, z: 0.35, r: 0 },
    { src: "stickers/plane.webp", x: 43, y: 93, w: 92, z: 1.3, r: -12 },
    { src: "objects/ring-05.webp", x: 24, y: 96, w: 84, z: 0.9, r: 16 },
  ],
  tall: [
    { src: "objects/ring-00.webp", x: 90, y: 71, w: 62, z: 0.9, r: 12 },
    { src: "objects/ring-02.webp", x: 9, y: 73, w: 46, z: 0.7, r: -8 },
    { src: "objects/ring-03.webp", x: 9, y: 97, w: 58, z: 1.1, r: -6 },
    { src: "objects/card-03.webp", x: 91, y: 97, w: 34, z: 1.0, r: 0 },
    { src: "objects/ring-08.webp", x: 93, y: 3, w: 20, z: 0.5, r: 0 },
    { src: "objects/ring-07.webp", x: 6, y: 3, w: 22, z: 0.6, r: 0 },
    { src: "stickers/plane.webp", x: 58, y: 99, w: 56, z: 1.2, r: -12 },
  ],
};

function bezier(p, t) {
  const u = 1 - t;
  const x = u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0];
  const y = u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1];
  return [x, y];
}

export function initHeroFx({ reduced }) {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;
  const back = hero.querySelector(".hero-dust--back");
  const front = hero.querySelector(".hero-dust--front");
  const layer = hero.querySelector(".hero-objects");
  const copy = hero.querySelector(".hero-copy");
  const card = hero.querySelector(".hero-visual");
  const bctx = back.getContext("2d");
  const fctx = front.getContext("2d");

  let mode = "", W = 0, H = 0, dpr = 1, dust = [], stars = [], objects = [];
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const build = () => {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [back, front]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const next = W < 900 ? "tall" : "wide";
    if (next === mode) return;
    mode = next;

    const rivers = RIVERS[mode];
    const total = mode === "wide" ? 2600 : 1200;
    dust = [];
    rivers.forEach((river) => {
      const n = Math.round(total * river.share);
      for (let i = 0; i < n; i++) {
        dust.push({
          river, t: Math.random(),
          off: ((Math.random() + Math.random() + Math.random()) / 1.5 - 1) * river.width,
          speed: 0.006 + Math.random() * 0.018,
          size: Math.random() < 0.06 ? 2.4 + Math.random() * 1.8 : 0.7 + Math.random() * 1.5,
          z: 0.3 + Math.random() * 0.9,
          color: DUST_COLORS[(Math.random() * DUST_COLORS.length) | 0],
          phase: Math.random() * TAU,
          front: Math.random() < 0.12,
        });
      }
    });
    stars = Array.from({ length: mode === "wide" ? 260 : 120 }, () => ({
      x: Math.random(), y: Math.random(), size: 0.5 + Math.random() * 1.3, phase: Math.random() * TAU, z: 0.2 + Math.random() * 0.5,
    }));

    layer.replaceChildren();
    const scale = mode === "wide" ? Math.min(1.25, Math.max(0.75, W / 1440)) : Math.max(0.8, W / 390);
    objects = OBJECTS[mode].map((o, i) => {
      const img = document.createElement("img");
      img.src = `assets/img/${o.src}`;
      img.alt = "";
      img.decoding = "async";
      img.className = "hero-object";
      img.style.width = `${Math.round(o.w * scale)}px`;
      img.style.left = `${o.x}%`;
      img.style.top = `${o.y}%`;
      if (o.z < 0.5) img.classList.add("is-far");
      layer.append(img);
      return { ...o, img, phase: i * 1.3 };
    });
  };

  const draw = (time) => {
    const s = time / 1000;
    const scrollY = window.scrollY;
    const leave = clamp(scrollY / Math.max(1, H));
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.clearRect(0, 0, W, H);
    fctx.clearRect(0, 0, W, H);

    for (const st of stars) {
      bctx.globalAlpha = (0.25 + 0.35 * Math.sin(s * 1.6 + st.phase)) * (1 - leave * 0.5);
      bctx.fillStyle = "#FFF3A6";
      bctx.fillRect(st.x * W + pointer.x * 20 * st.z, st.y * H + pointer.y * 14 * st.z - scrollY * 0.1 * st.z, st.size, st.size);
    }

    const boost = 1 + leave * 3;
    for (const p of dust) {
      if (!reduced) p.t += (p.speed / 60) * boost;
      if (p.t > 1) p.t -= 1;
      const [x, y] = bezier(p.river.p, p.t);
      const [x2, y2] = bezier(p.river.p, Math.min(1, p.t + 0.01));
      const dx = x2 - x, dy = y2 - y, len = Math.hypot(dx, dy) || 1;
      const wob = Math.sin(s * 0.9 + p.phase) * 0.006;
      const px = (x - (dy / len) * (p.off + wob)) * W + pointer.x * 36 * p.z;
      const py = (y + (dx / len) * (p.off + wob)) * H + pointer.y * 24 * p.z - scrollY * 0.2 * p.z;
      const fade = Math.min(1, p.t * 12, (1 - p.t) * 12);
      // keep the foreground layer clear of the headline and buttons
      const overCopy = mode === "wide" ? px < W * 0.5 && py > H * 0.1 && py < H * 0.93 : py < H * 0.64;
      const ctx = p.front && !overCopy ? fctx : bctx;
      ctx.globalAlpha = fade * (0.55 + 0.45 * Math.sin(s * 2.2 + p.phase));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size * (p.front && !overCopy ? 1.5 : 1), 0, TAU);
      ctx.fill();
    }
    bctx.globalAlpha = 1;
    fctx.globalAlpha = 1;

    for (const o of objects) {
      const bob = reduced ? 0 : Math.sin(s * 0.9 + o.phase) * 10;
      const rot = o.r + (reduced ? 0 : Math.sin(s * 0.6 + o.phase) * 8);
      const tx = pointer.x * 40 * o.z;
      const ty = pointer.y * 28 * o.z + bob - scrollY * 0.35 * o.z;
      o.img.style.transform = `translate(-50%, -50%) translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
    }

    // Leaving the hero: copy lifts and fades, the card sinks back
    if (copy) {
      copy.style.transform = `translateY(${(-leave * 90).toFixed(1)}px)`;
      copy.style.opacity = (1 - leave * 0.9).toFixed(3);
    }
    if (card) {
      card.style.transform = `translateY(${(leave * 60).toFixed(1)}px) scale(${(1 - leave * 0.08).toFixed(3)})`;
      card.style.opacity = (1 - leave * 0.6).toFixed(3);
    }
  };

  build();
  new ResizeObserver(() => { build(); if (reduced) draw(0); }).observe(hero);

  if (reduced) {
    draw(0);
    return;
  }

  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  let running = false;
  let frame = 0;
  const tick = (time) => {
    if (!running) return;
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
  }).observe(hero);
}
