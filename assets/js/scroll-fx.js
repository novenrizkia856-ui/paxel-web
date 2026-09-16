// Section transitions driven by scroll. Each [data-fx] element gets --p from 0 (just below the
// fold) to 1 (settled), and CSS turns that into the motion. Without JavaScript --p stays at 1.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);

export function initScrollFx({ reduced }) {
  const items = [...document.querySelectorAll("[data-fx]")];
  if (reduced || !items.length) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const span = Number(el.dataset.fxSpan || 0.75);
      const p = ease(clamp((vh - r.top) / (vh * span)));
      el.style.setProperty("--p", p.toFixed(4));
    }
  };
  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  document.documentElement.classList.add("fx-ready");
  update();
}
