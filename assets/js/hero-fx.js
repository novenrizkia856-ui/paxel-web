// Hero: one large passport card that floats, tilts toward the cursor and catches the light.
// Toned illustration objects drift around the card only, and a fine champagne dust orbits it.
const TAU = Math.PI * 2;
const DUST_COLORS = ["#C9B28A", "#B89B6E", "#A88F63", "#D9C7A3", "#8C7650"];
const clamp = (v, a = -1, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Positions are percent of the card stage. front sits above the card, z is parallax depth.
const OBJECTS = [
  { src: "objects/card-00.webp", x: 62, y: 7, w: 12, z: 0.8, r: 8 },
  { src: "objects/ring-00.webp", x: 93, y: 14, w: 15, z: 0.5, r: 14, far: true },
  { src: "objects/ring-01.webp", x: 9, y: 24, w: 12, z: 1.1, r: -12, front: true },
  { src: "objects/card-01.webp", x: 28, y: 12, w: 7, z: 0.6, r: 0 },
  { src: "objects/ring-02.webp", x: 95, y: 62, w: 11, z: 1.2, r: 10, front: true },
  { src: "objects/card-03.webp", x: 76, y: 90, w: 8, z: 1.0, r: 0, front: true },
  { src: "objects/ring-03.webp", x: 14, y: 84, w: 14, z: 0.9, r: -8 },
  { src: "objects/card-02.webp", x: 3, y: 56, w: 5.5, z: 0.4, r: 16, far: true },
  { src: "objects/ring-04.webp", x: 46, y: 95, w: 11, z: 1.3, r: -6, front: true },
  { src: "stickers/plane.webp", x: 88, y: 38, w: 12, z: 0.7, r: -14 },
  { src: "objects/ring-08.webp", x: 36, y: 80, w: 4, z: 0.5, r: -18, far: true },
];

export function initHeroFx({ reduced }) {
  const hero = document.querySelector("[data-hero]");
  const stage = hero?.querySelector("[data-card-stage]");
  if (!stage) return;
  const card = stage.querySelector("[data-card3d]");
  const shadow = stage.querySelector(".card-shadow");
  const canvas = stage.querySelector(".card-dust");
  const layer = stage.querySelector(".card-objects");
  const copy = hero.querySelector(".hero-copy");
  const visual = hero.querySelector(".hero-visual");
  const ctx = canvas.getContext("2d");

  const objects = OBJECTS.map((o, i) => {
    const img = document.createElement("img");
    img.src = `assets/img/${o.src}`;
    img.alt = "";
    img.decoding = "async";
    img.className = "card-object" + (o.front ? " is-front" : "") + (o.far ? " is-far" : "");
    img.style.left = `${o.x}%`;
    img.style.top = `${o.y}%`;
    img.style.width = `${o.w}%`;
    layer.append(img);
    return { ...o, img, phase: i * 1.37 };
  });

  const dust = Array.from({ length: 520 }, () => ({
    a: Math.random() * TAU,
    r: 0.3 + Math.random() * 0.2 + (Math.random() - 0.5) * 0.12,
    speed: (0.02 + Math.random() * 0.06) * (Math.random() < 0.5 ? 1 : 0.6),
    size: Math.random() < 0.08 ? 1.8 + Math.random() * 1.4 : 0.6 + Math.random() * 1.1,
    color: DUST_COLORS[(Math.random() * DUST_COLORS.length) | 0],
    phase: Math.random() * TAU,
    lift: (Math.random() - 0.5) * 0.1,
  }));

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  };
  resize();
  new ResizeObserver(resize).observe(stage);

  // Pointer, relative to the card stage centre, in -1..1
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  let lastMove = -1e9;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (finePointer && !reduced) {
    window.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      target.x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 0.75));
      target.y = clamp((e.clientY - (r.top + r.height / 2)) / (r.height * 0.75));
      lastMove = performance.now();
    }, { passive: true });
    document.addEventListener("pointerleave", () => { target.x = 0; target.y = 0; });
  }

  const draw = (time) => {
    const s = time / 1000;
    // When the cursor rests, the card sways on its own
    const idle = clamp((time - lastMove - 1500) / 1500, 0, 1);
    const tx = lerp(target.x, Math.sin(s * 0.45) * 0.45, finePointer ? idle : 1);
    const ty = lerp(target.y, Math.cos(s * 0.38) * 0.35, finePointer ? idle : 1);
    cur.x = lerp(cur.x, reduced ? 0 : tx, 0.08);
    cur.y = lerp(cur.y, reduced ? 0 : ty, 0.08);

    const float = reduced ? 0 : Math.sin(s * 1.1) * 10;
    card.style.setProperty("--ry", `${(-16 + cur.x * 22).toFixed(2)}deg`);
    card.style.setProperty("--rx", `${(16 - cur.y * 16).toFixed(2)}deg`);
    card.style.setProperty("--lift", `${float.toFixed(1)}px`);
    card.style.setProperty("--shift-x", `${(cur.x * 14).toFixed(1)}px`);
    card.style.setProperty("--gx", `${(35 + cur.x * 40).toFixed(1)}%`);
    card.style.setProperty("--gy", `${(25 + cur.y * 35).toFixed(1)}%`);
    card.style.setProperty("--glare", `${(cur.x * 30 - cur.y * 10).toFixed(1)}%`);
    shadow.style.setProperty("--shadow-x", `${(-cur.x * 24).toFixed(1)}px`);
    shadow.style.setProperty("--shadow-s", (1 - float / 90).toFixed(3));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2 + cur.x * 10, cy = H / 2;
    for (const p of dust) {
      if (!reduced) p.a += (p.speed / 60) * 0.5;
      const rr = p.r + Math.sin(s * 0.7 + p.phase) * 0.015;
      const x = cx + Math.cos(p.a) * rr * W;
      const y = cy + Math.sin(p.a) * rr * H * 0.62 + p.lift * H - Math.cos(p.a) * H * 0.08;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(s * 1.8 + p.phase);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const o of objects) {
      const bob = reduced ? 0 : Math.sin(s * 0.9 + o.phase) * 9;
      const rot = o.r + (reduced ? 0 : Math.sin(s * 0.55 + o.phase) * 7);
      const px = cur.x * 30 * o.z;
      const py = cur.y * 22 * o.z + bob;
      o.img.style.transform = `translate(-50%, -50%) translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
    }

    // Leaving the hero: the copy lifts away and the card stage sinks back
    const leave = clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1);
    copy.style.transform = `translateY(${(-leave * 80).toFixed(1)}px)`;
    copy.style.opacity = (1 - leave * 0.9).toFixed(3);
    visual.style.transform = `translateY(${(leave * 70).toFixed(1)}px) scale(${(1 - leave * 0.1).toFixed(3)})`;
    visual.style.opacity = (1 - leave * 0.7).toFixed(3);
  };

  if (reduced) {
    draw(0);
    new ResizeObserver(() => draw(0)).observe(stage);
    return;
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
