import { initContractBar } from "./contract-bar.js";
import { initNav } from "./nav.js";
import { initReveal } from "./reveal.js";
import { initScrollFx } from "./scroll-fx.js";
import { mountHeroRosette, mountStaticRosette } from "./rosette.js";
import { initTilt } from "./tilt.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

function initHeroGlow() {
  const hero = document.querySelector("[data-hero]");
  if (!hero || reduced || !window.matchMedia("(pointer: fine)").matches) return;
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
    hero.style.setProperty("--my", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
  });
}

// Docs, GitHub and social links are placeholders until they exist
function initPlaceholders() {
  const toast = document.querySelector("[data-toast]");
  let timer;
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-placeholder]");
    if (!link) return;
    event.preventDefault();
    if (!toast) return;
    toast.textContent = "Link coming soon.";
    toast.classList.add("is-visible");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  });
}

function boot() {
  initContractBar();
  initNav();
  initReveal({ reduced });
  initScrollFx({ reduced });
  initTilt({ reduced });
  initHeroGlow();
  initPlaceholders();

  const hero = document.querySelector("[data-rosette]");
  if (hero) mountHeroRosette(hero, { reduced });
  document.querySelectorAll("[data-rosette-static]").forEach(mountStaticRosette);

  root.classList.add("motion-ready");
}

try {
  boot();
} catch (error) {
  root.classList.add("reveal-all");
  throw error;
}
