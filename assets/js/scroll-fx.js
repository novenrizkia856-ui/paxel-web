// Scroll linked effects, batched into one animation frame per scroll.
//   sheets     paper panels scale up as they rise into view
//   how track  progress line fills and step nodes light up in order
//   hero art   slow parallax on the guilloché rosette
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function initScrollFx({ reduced }) {
  const sheets = [...document.querySelectorAll("[data-sheet]")];
  const track = document.querySelector("[data-how-track]");
  const steps = track ? [...track.querySelectorAll("[data-step]")] : [];
  const hero = document.querySelector("[data-hero]");
  const heroArt = document.querySelector("[data-hero-art]");
  const wide = window.matchMedia("(min-width: 1024px)");

  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;

    if (!reduced) {
      const minScale = wide.matches ? 0.94 : 0.97;
      sheets.forEach((sheet) => {
        const top = sheet.getBoundingClientRect().top;
        const p = clamp((vh - top) / (vh * 0.8));
        sheet.style.transform = p >= 1 ? "" : `scale(${minScale + (1 - minScale) * easeOut(p)})`;
      });

      if (heroArt) {
        const y = window.scrollY;
        if (y < vh * 1.5) {
          heroArt.style.setProperty("--parallax", `${(y * 0.18).toFixed(1)}px`);
          // The phone reads the raw offset and moves less, so it feels closer than the rosette
          hero.style.setProperty("--hero-y", y.toFixed(1));
        }
      }
    }

    if (track) {
      const rect = track.getBoundingClientRect();
      let p;
      let thresholds;
      if (wide.matches) {
        p = clamp((vh * 0.78 - rect.top) / (vh * 0.4));
        thresholds = steps.map((_, i) => i / steps.length);
      } else {
        p = clamp((vh * 0.62 - rect.top) / rect.height);
        thresholds = steps.map((step) => step.offsetTop / rect.height);
      }
      if (reduced) p = rect.top < vh ? 1 : 0;
      track.style.setProperty("--p", p.toFixed(4));
      steps.forEach((step, i) => step.classList.toggle("is-active", p > 0 && p >= thresholds[i]));
    }
  };

  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  update();
}
