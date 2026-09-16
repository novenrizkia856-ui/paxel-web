import { initContractBar } from "./contract-bar.js";
import { initNav } from "./nav.js";
import { initReveal } from "./reveal.js";
import { initTilt } from "./tilt.js";
import { initPlay } from "./play.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

// Docs and social links are placeholders until they exist
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
  initTilt({ reduced });
  initPlay({ reduced });
  initPlaceholders();
  root.classList.add("motion-ready");
}

try {
  boot();
} catch (error) {
  root.classList.add("reveal-all");
  throw error;
}
