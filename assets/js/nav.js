// Static nav in the flow plus a floating glass copy.
// Visibility rule taken from the reference: show past 56px while scrolling up
// once the upward travel exceeds 40px. Any other scroll hides it unless its menu is open.
const SHOW_AFTER = 56;
const UP_DISTANCE = 40;

function setupMenu(nav) {
  const toggle = nav.querySelector("[data-nav-toggle]");
  const panel = nav.querySelector("[data-nav-panel]");
  if (!toggle || !panel) return { close() {}, isOpen: () => false };

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  return { close: () => setOpen(false), isOpen: () => nav.classList.contains("is-open") };
}

export function initNav() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;

  const staticMenu = setupMenu(nav);
  window.matchMedia("(min-width: 960px)").addEventListener("change", (event) => {
    if (event.matches) staticMenu.close();
  });

  const clone = nav.cloneNode(true);
  clone.classList.remove("container", "is-open");
  clone.removeAttribute("data-nav");
  clone.setAttribute("aria-label", "Main, floating");
  clone.querySelector("[data-nav-panel]").id = "nav-panel-float";
  clone.querySelector("[data-nav-toggle]").setAttribute("aria-controls", "nav-panel-float");
  clone.querySelector("[data-nav-toggle]").setAttribute("aria-expanded", "false");

  const float = document.createElement("div");
  float.className = "nav-float";
  float.inert = true;
  float.append(clone);
  document.body.append(float);

  const floatMenu = setupMenu(clone);

  let visible = false;
  let lastY = window.scrollY;
  let anchorY = lastY;
  let goingUp = false;

  const setVisible = (next) => {
    if (next === visible) return;
    visible = next;
    float.classList.toggle("is-visible", next);
    float.inert = !next;
    if (!next) floatMenu.close();
  };

  const onScroll = () => {
    const y = window.scrollY;
    const up = y < lastY;
    if (!goingUp && up) {
      // Measure from the turning point so one large jump still counts
      anchorY = lastY;
      goingUp = true;
    } else if (goingUp && !up) {
      goingUp = false;
    }
    const travelled = Math.abs(anchorY - y);
    if (y > SHOW_AFTER && up && travelled > UP_DISTANCE) setVisible(true);
    else if (!floatMenu.isOpen()) setVisible(false);
    lastY = y;
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  // Close the floating menu on outside click, like the reference
  document.addEventListener("click", (event) => {
    if (floatMenu.isOpen() && !float.contains(event.target)) {
      floatMenu.close();
      if (window.scrollY <= SHOW_AFTER) setVisible(false);
    }
  }, true);
}
