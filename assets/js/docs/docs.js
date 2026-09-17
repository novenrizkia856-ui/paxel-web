// Docs page behaviour: mobile navigation, on this page highlighting, code copy and search.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const body = document.body;
const desktop = window.matchMedia("(min-width: 1024px)");

/* Mobile navigation */
function initNav() {
  const toggle = $("[data-nav-toggle]");
  const nav = $("[data-docs-nav]");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    body.classList.toggle("nav-locked", open && !desktop.matches);
    if (open) $('[aria-current="page"]', nav)?.scrollIntoView({ block: "center" });
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  desktop.addEventListener("change", () => setOpen(false));

  // Keep the current page visible in a long sidebar
  if (desktop.matches) {
    const current = $('[aria-current="page"]', nav);
    if (current && current.offsetTop > nav.clientHeight - 120) nav.scrollTop = current.offsetTop - 120;
  }
}

/* On this page: highlight the section being read */
function initToc() {
  const links = $$("[data-toc] a");
  if (!links.length) return;
  const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const headings = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  let active = null;

  const update = () => {
    const line = 120;
    let current = headings[0];
    for (const h of headings) {
      if (h.getBoundingClientRect().top - line <= 0) current = h;
      else break;
    }
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = headings[headings.length - 1];
    const link = byId.get(current?.id);
    if (link === active) return;
    active?.classList.remove("is-active");
    link?.classList.add("is-active");
    active = link;
  };

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    },
    { passive: true },
  );
  update();

  // Close the mobile list after choosing a section
  $$(".toc-mobile a").forEach((a) =>
    a.addEventListener("click", () => {
      a.closest("details")?.removeAttribute("open");
    }),
  );
}

/* Code copy and back to top */
function initSmallBits() {
  document.addEventListener("click", async (event) => {
    const copy = event.target.closest("[data-copy-code]");
    if (copy) {
      const text = copy.parentElement.querySelector("code")?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(text);
        copy.textContent = "Copied";
      } catch {
        copy.textContent = "Copy failed";
      }
      setTimeout(() => (copy.textContent = "Copy"), 1400);
      return;
    }
    const top = event.target.closest("[data-back-top]");
    if (top) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", window.location.pathname);
    }
  });
}

/* Search */
function initSearch() {
  const root = $("[data-search]");
  const input = $("[data-search-input]");
  const list = $("[data-search-results]");
  if (!root || !input || !list) return;

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const kbd = $("[data-search-kbd]");
  if (kbd && isMac) kbd.textContent = "⌘ K";

  let index = null;
  let results = [];
  let selected = 0;
  let lastFocus = null;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const words = (q) => q.toLowerCase().split(/\s+/).filter(Boolean);
  const highlight = (text, terms) => {
    let html = esc(text);
    for (const t of terms) {
      const safe = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp(`(${safe})`, "gi"), "<mark>$1</mark>");
    }
    return html;
  };
  const snippet = (text, terms) => {
    const lower = text.toLowerCase();
    const at = Math.min(...terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0), text.length);
    const start = Math.max(0, at - 50);
    return (start > 0 ? "…" : "") + text.slice(start, start + 180);
  };

  async function load() {
    if (!index) index = (await import("./search-index.js")).default;
    return index;
  }

  function score(entry, terms) {
    const page = entry.page.toLowerCase();
    const heading = entry.heading.toLowerCase();
    const text = entry.text.toLowerCase();
    let total = 0;
    for (const t of terms) {
      let s = 0;
      if (heading.includes(t)) s += heading.startsWith(t) ? 12 : 8;
      if (page.includes(t)) s += 6;
      if (text.includes(t)) s += 2 + Math.min(3, text.split(t).length - 2);
      if (!s) return 0;
      total += s;
    }
    return total;
  }

  function render() {
    const q = input.value.trim();
    if (!q) {
      list.innerHTML = '<li class="search-empty">Type to search every page.</li>';
      results = [];
      return;
    }
    const terms = words(q);
    results = (index ?? [])
      .map((entry) => ({ entry, s: score(entry, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((r) => r.entry);
    selected = 0;
    if (!results.length) {
      list.innerHTML = '<li class="search-empty">No results for this search.</li>';
      return;
    }
    list.innerHTML = results
      .map(
        (r, i) => `<li><a href="${r.url}" role="option" aria-selected="${i === 0}" data-i="${i}">
          <small>${esc(r.group)} · ${esc(r.page)}</small>
          <b>${highlight(r.heading || r.page, terms)}</b>
          ${r.text ? `<span>${highlight(snippet(r.text, terms), terms)}</span>` : ""}
        </a></li>`,
      )
      .join("");
  }

  function select(i) {
    const links = $$("a", list);
    if (!links.length) return;
    selected = (i + links.length) % links.length;
    links.forEach((a, n) => a.setAttribute("aria-selected", String(n === selected)));
    links[selected].scrollIntoView({ block: "nearest" });
  }

  async function open() {
    lastFocus = document.activeElement;
    root.hidden = false;
    body.classList.add("nav-locked");
    input.focus();
    input.select();
    await load();
    render();
  }

  function close() {
    root.hidden = true;
    body.classList.remove("nav-locked");
    lastFocus?.focus?.();
  }

  $$("[data-search-open]").forEach((b) => b.addEventListener("click", open));
  $$("[data-search-close]", root).forEach((b) => b.addEventListener("click", close));
  input.addEventListener("input", render);
  list.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      select(selected + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      select(selected - 1);
    } else if (event.key === "Enter") {
      const link = $$("a", list)[selected];
      if (link) {
        event.preventDefault();
        close();
        window.location.href = link.href;
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? "");
    if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      root.hidden ? open() : close();
    } else if (event.key === "/" && !typing && root.hidden) {
      event.preventDefault();
      open();
    } else if (event.key === "Escape" && !root.hidden) {
      close();
    }
  });
}

initNav();
initToc();
initSmallBits();
initSearch();
