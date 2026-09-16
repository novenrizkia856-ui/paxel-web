// Fade and rise entrances, plus masked headline lines.
// Children of [data-reveal-group] get a staggered delay unless they set one inline.
const STAGGER_MS = 90;

export function initReveal({ reduced }) {
  const items = document.querySelectorAll("[data-reveal]");

  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    [...group.children].forEach((child, index) => {
      if (child.hasAttribute("data-reveal") && !child.style.getPropertyValue("--d")) {
        child.style.setProperty("--d", `${index * STAGGER_MS}ms`);
      }
    });
  });

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
}
