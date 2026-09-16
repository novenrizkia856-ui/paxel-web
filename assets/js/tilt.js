// Gentle pointer tilt on the passport preview card.
const MAX_X = 6;
const MAX_Y = 8;

export function initTilt({ reduced }) {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduced || !canHover) return;

  document.querySelectorAll("[data-tilt]").forEach((stage) => {
    const card = stage.querySelector(".pp-card");
    if (!card) return;

    stage.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      card.classList.add("is-tilting");
      card.style.setProperty("--ry", `${(px * MAX_Y).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${(-py * MAX_X).toFixed(2)}deg`);
    });

    stage.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}
