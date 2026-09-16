// Pointer tilt with a moving sheen and a foil seal that turns with the card.
const MAX_X = 10;
const MAX_Y = 14;

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
      card.style.setProperty("--sx", `${((px + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty("--sy", `${((py + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty("--tilt", `${(px * 140).toFixed(1)}deg`);
    });

    stage.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      ["--rx", "--ry", "--tilt"].forEach((prop) => card.style.setProperty(prop, "0deg"));
    });
  });
}
