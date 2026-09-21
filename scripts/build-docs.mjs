// Builds the static docs pages from content/docs/*.md.
//
//   content/docs/*.md             source, one file per page (README.md is the docs home)
//   docs/*.html                   generated pages, one per markdown file (Vite builds them)
//   assets/js/docs/search-index.js  generated search index, loaded when search opens
//
// Runs before `vite` and `vite build` (see package.json). Generated files are gitignored.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Marked } from "marked";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "content/docs");
const OUT = join(root, "docs");
const INDEX_OUT = join(root, "assets/js/docs/search-index.js");

const { CONTRACTS } = await import(pathToFileURL(join(root, "config/contracts.config.js")).href);
const { CHAINS } = await import(pathToFileURL(join(root, "assets/js/app/chain.js")).href);

// Sidebar groups, in reading order. Prev and next follow this order.
const GROUPS = [
  { title: "Foundations", pages: ["README", "overview", "core-concepts", "data-model"] },
  { title: "Architecture", pages: ["architecture", "roles-and-actors", "trust-and-verification"] },
  { title: "Building", pages: ["smart-contracts", "live-contracts", "api-and-sdk", "interoperability-and-standards"] },
  { title: "Governance", pages: ["security-and-compliance", "mvp-scope", "glossary"] },
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const strip = (html) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const slugify = (text) => strip(text).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, "-");
const urlFor = (name) => (name === "README" ? "/docs" : `/docs/${name}`);

/* Contract values for {{tokens}} in the markdown */
const chain = CHAINS[String(CONTRACTS.chainId).trim()];
const TOKENS = { ...CONTRACTS, explorer: chain?.explorerUrl ?? "" };
const fillTokens = (md) => md.replace(/\{\{(\w+)\}\}/g, (_, key) => String(TOKENS[key] ?? ""));

/* Diagrams. The source uses mermaid; the site renders responsive HTML versions instead. */
const DIAGRAMS = {
  lifecycle: `
<figure class="dg dg-life" aria-label="Passport lifecycle">
  <ol class="dg-flow">
    <li class="dg-node"><b>Draft</b><span>Passport opened by the issuer</span></li>
    <li class="dg-node"><b>Issued</b><span>Initial record verified and published</span></li>
    <li class="dg-node dg-node--main"><b>Active</b><span>Normal lifecycle</span>
      <ul class="dg-loops" aria-label="Events that keep a passport Active">
        <li>Transfer</li><li>Valuation update</li><li>Document added</li><li>Corporate or asset event</li>
      </ul>
    </li>
  </ol>
  <div class="dg-branches">
    <div class="dg-node dg-node--flag"><b>Flagged state</b><span>Frozen or Disputed. Returns to Active once resolved.</span></div>
    <div class="dg-node dg-node--end"><b>Terminal state</b><span>Redeemed, Delisted or Matured. Readable forever.</span></div>
  </div>
  <figcaption>Every step is a new event. Nothing is removed.</figcaption>
</figure>`,
  architecture: `
<figure class="dg dg-arch" aria-label="System architecture">
  <div class="dg-layer"><span class="dg-layer-name">Presentation layer</span>
    <div class="dg-row"><div class="dg-box">Human readable passport viewer</div><div class="dg-box">Machine consumers: dApps, platforms, custodians</div></div></div>
  <div class="dg-link" aria-hidden="true"></div>
  <div class="dg-layer"><span class="dg-layer-name">Integration layer</span>
    <div class="dg-row"><div class="dg-box dg-box--wide">APIs and SDKs</div></div></div>
  <div class="dg-link" aria-hidden="true"></div>
  <div class="dg-layer dg-layer--chain"><span class="dg-layer-name">Smart contract layer</span>
    <div class="dg-row dg-row--4"><div class="dg-box">Passport Registry</div><div class="dg-box">Event and History Log</div><div class="dg-box">Attestation Registry</div><div class="dg-box dg-box--gate">Access Control<small>Registry and Log check it</small></div></div></div>
  <div class="dg-link dg-link--dashed" aria-hidden="true"></div>
  <div class="dg-layer"><span class="dg-layer-name">Data and storage layer</span>
    <div class="dg-row"><div class="dg-box">Documents and large content<small>Hash anchored from the Registry and the Log</small></div><div class="dg-box">Indexer and query cache<small>Read by the APIs</small></div></div></div>
</figure>`,
};
const diagramFor = (code) => (/subgraph/.test(code) ? DIAGRAMS.architecture : DIAGRAMS.lifecycle);

/* Titles come from SUMMARY.md so the table of contents stays the single source */
const titles = {};
for (const m of readFileSync(join(SRC, "SUMMARY.md"), "utf8").matchAll(/\[([^\]]+)\]\(([^)]+)\.md\)/g)) {
  titles[m[2]] = m[1] === "Introduction" ? "Introduction" : m[1];
}
titles["live-contracts"] = titles["live-contracts"] ?? "Live Contracts";

const order = GROUPS.flatMap((g) => g.pages.map((name) => ({ name, group: g.title })));
const known = new Set(order.map((p) => p.name));
for (const file of readdirSync(SRC)) {
  const name = file.replace(/\.md$/, "");
  if (file.endsWith(".md") && name !== "SUMMARY" && !known.has(name)) throw new Error(`${file} is not in GROUPS`);
}

function render(name) {
  const toc = [];
  const sections = [];
  let current = { heading: "", anchor: "", text: [] };
  const used = new Set();
  const uniqueId = (text) => {
    let id = slugify(text) || "section";
    let n = 2;
    while (used.has(id)) id = `${slugify(text)}-${n++}`;
    used.add(id);
    return id;
  };

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        if (depth === 1) return "";
        const id = uniqueId(inner);
        if (depth <= 3) toc.push({ depth, id, text: strip(inner) });
        sections.push(current);
        current = { heading: strip(inner), anchor: id, text: [] };
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-label="Link to this section">#</a>${inner}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        let url = href;
        const md = href.match(/^([\w-]+)\.md(#.*)?$/);
        if (md) url = urlFor(md[1]) + (md[2] ?? "");
        const external = /^https?:\/\//.test(url);
        return `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ""}${external ? ' target="_blank" rel="noopener"' : ""}>${inner}</a>`;
      },
      code({ text, lang }) {
        if (lang === "mermaid") return diagramFor(text);
        return `<div class="code"><button class="code-copy" type="button" data-copy-code aria-label="Copy code">Copy</button><pre><code>${esc(text)}</code></pre></div>\n`;
      },
      blockquote({ tokens }) {
        return `<aside class="callout">${this.parser.parse(tokens)}</aside>\n`;
      },
      paragraph({ tokens }) {
        const html = this.parser.parseInline(tokens);
        current.text.push(strip(html));
        return `<p>${html}</p>\n`;
      },
      tablecell(cell) {
        const html = this.parser.parseInline(cell.tokens);
        if (!cell.header) current.text.push(strip(html));
        const tag = cell.header ? "th" : "td";
        return `<${tag}${cell.align ? ` align="${cell.align}"` : ""}>${html}</${tag}>\n`;
      },
      listitem(item) {
        const html = this.parser.parse(item.tokens, !!item.loose);
        current.text.push(strip(html));
        return `<li>${html}</li>\n`;
      },
    },
  });

  const source = fillTokens(readFileSync(join(SRC, `${name}.md`), "utf8"));
  const title = name === "README" ? "Introduction" : (source.match(/^#\s+(.+)$/m)?.[1] ?? titles[name]);
  let html = marked.parse(source);
  sections.push(current);
  // Tables scroll sideways on small screens. Two column tables fit, so they wrap instead.
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, (_, inner) => {
    const cols = (inner.match(/<thead>[\s\S]*?<\/thead>/)?.[0].match(/<th[ >]/g) ?? []).length;
    return `<div class="table-wrap${cols <= 2 ? " table-wrap--fit" : ""}"><table>${inner}</table></div>`;
  });
  const description = sections.flatMap((s) => s.text).find((t) => t.length > 40) ?? title;
  return { title, navTitle: titles[name] ?? title, html, toc, sections, description };
}

const pages = order.map((p) => ({ ...p, ...render(p.name), url: urlFor(p.name) }));

const icon = (id, cls = "") => `<svg class="i ${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <symbol id="logo" viewBox="0 0 159.27 100"><path fill="currentColor" d="M19.45 99.9C19.45 99.85 19.73 99.15 20.07 98.34C20.4 97.53 21.84 94.06 23.26 90.61C24.68 87.17 26.33 83.19 26.92 81.77C29.25 76.12 30.19 73.86 31.62 70.36C34.68 62.95 36.4 59.92 39.02 57.34C41.84 54.56 45.1 53.0 49.66 52.27C51.68 51.94 57.88 51.92 64.73 52.22C74.48 52.64 78.02 52.41 81.9 51.12C86.01 49.75 89.21 47.25 91.19 43.89C92.42 41.79 95.49 35.56 97.8 30.43C99.93 25.72 105.46 12.61 107.16 8.25C107.55 7.25 108.37 5.2 108.98 3.7L110.09 0.97L100.41 0.93C90.63 0.9 87.8 0.97 85.53 1.31C80.74 2.03 76.9 3.83 73.8 6.81C71.93 8.61 70.8 10.17 69.05 13.37C66.56 17.92 64.67 22.26 60.86 32.2C59.45 35.89 56.99 41.8 56.35 43.06C56.19 43.37 55.71 44.47 55.28 45.51L54.51 47.38L27.25 47.41C12.25 47.43 0.01 47.4 0.04 47.36C0.09 47.28 2.39 41.72 8.93 25.88C10.35 22.44 12.12 18.15 12.87 16.35C14.29 12.89 15.22 10.96 16.43 8.96C19.25 4.27 22.87 1.53 27.95 0.24L28.89 -0.0L89.1 0.03L149.32 0.06L150.46 0.37C151.82 0.74 153.59 1.59 154.61 2.36C157.77 4.76 159.53 8.75 159.15 12.66C158.99 14.34 158.82 14.9 157.42 18.26C156.95 19.39 156.1 21.46 155.52 22.87C154.94 24.27 154.4 25.48 154.32 25.54C154.24 25.61 153.59 27.2 152.87 29.08C150.18 36.07 148.66 39.24 146.44 42.49C141.94 49.08 136.68 52.26 128.67 53.26C127.93 53.35 124.55 53.4 117.92 53.41C108.14 53.43 106.86 53.47 104.44 53.88C99.94 54.64 96.2 56.42 93.32 59.2C90.86 61.56 89.56 63.52 86.97 68.71C84.97 72.72 83.62 75.91 80.78 83.3C78.71 88.71 75.97 95.35 75.64 95.75C75.59 95.81 75.16 96.79 74.71 97.91L73.87 99.94L46.66 99.97C31.6 99.99 19.45 99.96 19.45 99.9Z"/></symbol>
    <symbol id="logo-lockup" viewBox="0 0 423.08 100"><path fill="#EA580C" d="M20.85 96.39C34.07 64.26 34.4 63.49 36.37 60.48C37.46 58.81 39.77 56.38 41.15 55.44C43.37 53.94 45.99 52.9 48.94 52.36C51.17 51.95 59.18 51.92 66.93 52.28C71.29 52.49 72.99 52.5 75.19 52.31C79.79 51.94 83.51 50.79 86.27 48.89C87.72 47.9 89.77 45.79 90.65 44.39C91.54 42.98 95.12 35.81 97.07 31.54C99.35 26.53 104.86 13.51 106.83 8.46C107.41 6.97 109.39 2.06 109.74 1.23C109.8 1.08 106.63 1.03 98.42 1.07C89.07 1.1 86.71 1.17 85.28 1.42C78.2 2.65 73.47 5.79 69.98 11.57C67.57 15.56 64.85 21.6 61.23 31.01C59.16 36.39 57.83 39.62 56.44 42.69C55.98 43.7 55.34 45.19 55.0 46.01L54.39 47.5L27.28 47.5L0.17 47.5L0.3 47.07C0.43 46.68 2.33 42.03 7.15 30.38C8.0 28.32 9.91 23.69 11.39 20.1C15.23 10.73 16.86 7.73 19.6 4.99C21.7 2.89 24.01 1.52 26.99 0.6L28.31 0.19L88.53 0.2C141.73 0.2 148.89 0.23 149.99 0.49C155.73 1.84 159.61 7.75 158.59 13.56C158.4 14.65 157.71 16.57 156.26 20.1C155.12 22.85 154.07 25.29 153.92 25.54C153.76 25.78 153.08 27.42 152.41 29.19C150.06 35.36 148.7 38.31 146.88 41.23C143.18 47.16 138.84 50.65 133.08 52.33C129.87 53.26 129.16 53.31 116.92 53.46C106.05 53.6 105.17 53.63 103.41 54.02C97.81 55.25 93.63 57.84 90.61 61.96C87.95 65.59 84.73 72.48 80.39 83.81C78.75 88.09 76.68 93.11 75.53 95.58C75.16 96.37 74.61 97.65 74.31 98.41L73.75 99.8L46.6 99.81L19.45 99.81L20.85 96.39Z"/><path fill="currentColor" d="M256.35 83.64C249.21 83.14 243.84 78.82 242.37 72.4C241.86 70.18 241.91 65.86 242.47 63.75C243.56 59.65 245.89 56.74 249.56 54.86C253.51 52.85 257.9 51.97 267.12 51.34C273.79 50.88 276.65 50.16 278.04 48.57C278.75 47.76 278.94 46.92 278.75 45.43C278.43 42.84 277.09 40.87 274.93 39.8C271.63 38.18 266.13 38.38 262.6 40.25C260.25 41.5 258.25 44.18 257.67 46.87C257.54 47.48 257.42 48.0 257.4 48.03C257.37 48.07 247.44 45.93 244.66 45.29C244.38 45.22 244.23 45.04 244.23 44.77C244.23 42.94 246.26 38.37 247.93 36.42C251.22 32.59 256.05 30.12 262.6 28.92C265.25 28.44 272.57 28.42 275.1 28.89C279.33 29.68 282.95 31.17 285.72 33.25C289.56 36.15 291.87 40.39 292.59 45.83C292.84 47.73 292.88 50.9 292.88 65.39L292.88 82.69L285.87 82.69L278.85 82.69L278.85 78.62L278.85 74.55L277.45 75.9C271.77 81.39 264.14 84.19 256.35 83.64ZM371.44 83.06C367.93 82.59 364.04 81.3 361.25 79.68C358.97 78.36 357.78 77.44 355.94 75.57C351.95 71.52 349.58 66.28 348.84 59.81C348.51 57.01 348.71 51.46 349.22 48.95C350.92 40.61 355.56 34.45 362.79 30.95C370.82 27.06 381.13 27.18 389.13 31.24C391.78 32.59 393.42 33.79 395.58 35.95C399.0 39.38 401.0 43.12 402.24 48.44C402.63 50.09 402.74 51.19 402.83 54.15C402.89 56.17 402.88 58.31 402.8 58.91L402.66 60.0L382.8 60.0L362.93 60.0L363.09 60.86C364.03 65.84 366.32 69.25 369.82 70.85C371.8 71.76 373.16 72.01 375.87 71.98C382.19 71.92 386.87 69.3 389.89 64.15L390.62 62.9L391.32 63.19C391.7 63.35 394.12 64.36 396.68 65.42C399.25 66.48 401.35 67.45 401.35 67.57C401.35 67.99 400.17 70.26 399.16 71.8C395.22 77.76 389.43 81.41 381.73 82.78C379.57 83.17 373.44 83.33 371.44 83.06ZM182.88 44.89L182.88 7.09L199.28 7.17C216.75 7.25 217.07 7.27 221.24 8.26C227.62 9.77 232.9 13.01 236.25 17.47C238.37 20.29 239.65 23.07 240.51 26.73C241.15 29.44 241.34 34.91 240.89 37.79C239.29 48.18 232.46 55.47 221.81 58.15C217.64 59.2 216.56 59.28 206.39 59.37L196.92 59.45L196.92 71.07L196.92 82.69L189.9 82.69L182.88 82.69L182.88 44.89ZM297.31 82.61C297.31 82.56 298.25 81.2 299.39 79.58C313.34 59.9 316.05 56.0 316.04 55.67C316.04 55.46 311.88 49.44 306.8 42.29C301.72 35.14 297.5 29.19 297.42 29.07C297.32 28.9 299.31 28.85 305.38 28.85L313.48 28.85L318.65 36.67L323.81 44.49L328.97 36.68L334.13 28.87L342.27 28.86L350.4 28.85L349.55 30.05C337.27 47.31 331.39 55.69 331.47 55.82C331.53 55.91 335.75 61.88 340.84 69.1C345.94 76.31 350.18 82.32 350.26 82.45C350.38 82.64 348.74 82.69 342.33 82.69L334.25 82.69L329.09 74.91C326.26 70.62 323.89 67.12 323.82 67.12C323.76 67.12 321.39 70.62 318.56 74.9L313.42 82.69L305.36 82.69C300.93 82.69 297.31 82.65 297.31 82.61ZM409.04 45.0L409.04 7.31L416.06 7.31L423.08 7.31L423.08 45.0L423.08 82.69L416.06 82.69L409.04 82.69L409.04 45.0ZM268.19 75.1C270.44 74.34 271.64 73.58 273.48 71.75C275.84 69.39 277.2 66.87 278.08 63.24C278.47 61.6 279.02 56.26 278.81 56.05C278.74 55.99 278.34 56.11 277.92 56.33C276.8 56.9 274.65 57.44 272.12 57.79C264.28 58.86 262.58 59.25 260.33 60.44C258.86 61.21 257.26 62.95 256.75 64.32C256.2 65.78 255.89 67.94 256.04 69.22C256.63 74.25 262.39 77.04 268.19 75.1ZM388.27 49.89C388.27 49.42 387.52 47.34 386.91 46.12C385.1 42.52 382.11 40.27 378.11 39.5C371.64 38.26 365.93 41.67 363.75 48.09C363.48 48.86 363.27 49.61 363.27 49.75C363.27 49.95 365.52 50.0 375.77 50.0C382.64 50.0 388.27 49.95 388.27 49.89ZM216.54 46.75C219.25 46.02 220.85 45.15 222.52 43.48C224.12 41.89 224.87 40.62 225.61 38.26C226.02 36.96 226.06 36.49 226.05 33.17C226.04 29.74 226.01 29.43 225.52 27.98C223.83 22.92 219.96 20.04 214.02 19.43C212.95 19.32 208.67 19.23 204.5 19.23L196.92 19.23L196.92 33.28L196.92 47.34L205.91 47.26C214.53 47.19 214.97 47.17 216.54 46.75Z"/></symbol>
    <symbol id="i-search" viewBox="0 0 20 20"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-menu" viewBox="0 0 20 20"><path d="M3.5 6h13M3.5 10h13M3.5 14h13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-chevron" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-left" viewBox="0 0 20 20"><path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-right" viewBox="0 0 20 20"><path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-close" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-doc" viewBox="0 0 20 20"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" d="M5 2.75h6.5L15 6.25v11H5z"/><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M11.5 2.75v3.5H15M7.5 10h5M7.5 13h3.5"/></symbol>
  </svg>`;

function navHtml(active) {
  return GROUPS.map((g) => {
    const items = g.pages
      .map((name) => {
        const p = pages.find((x) => x.name === name);
        const current = name === active;
        return `<li><a href="${p.url}"${current ? ' aria-current="page"' : ""}>${esc(p.navTitle)}</a></li>`;
      })
      .join("");
    return `<div class="nav-group"><span class="nav-group-title">${g.title}</span><ul>${items}</ul></div>`;
  }).join("\n        ");
}

const tocList = (toc) =>
  toc.length
    ? `<ul>${toc.map((t) => `<li class="toc-${t.depth}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join("")}</ul>`
    : "";

function pageHtml(page, i) {
  const prev = pages[i - 1];
  const next = pages[i + 1];
  const docTitle = page.name === "README" ? "Paxel Docs" : `${page.title} · Paxel Docs`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(docTitle)}</title>
  <meta name="description" content="${esc(page.description.slice(0, 180))}">
  <meta name="theme-color" content="#FFFFFF">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(docTitle)}">
  <meta property="og:description" content="${esc(page.description.slice(0, 180))}">
  <meta property="og:image" content="/assets/brand/paxel-og.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="/assets/brand/paxel-og.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
  <link rel="stylesheet" href="/assets/css/docs.css">
  <script type="module" src="/assets/js/docs/docs.js"></script>
</head>
<body class="docs">
  ${SPRITE}
  <!--
    COPY · DOCS CHROME
    Skip link: Skip to content
    Header: the Paxel lockup. Docs. Search docs. Ctrl K. Home. Launch app.
    Docs home opens with the brand banner: one passport per supported asset.
    Mobile bar: Documentation, then the current page title.
    Side navigation groups: Foundations. Architecture. Building. Governance.
    Table of contents: On this page. Back to top.
    Pager: Previous. Next.
    Footer: © 2026 Paxel. Contracts live on Robinhood Chain.
    Search: Search the docs. Esc. No results for this search. Type to search every page.
    Page text comes from content/docs, generated by scripts/build-docs.mjs.
  -->
  <a class="skip-link" href="#content">Skip to content</a>

  <header class="docs-header">
    <div class="docs-bar">
      <a class="brand" href="/" aria-label="Paxel home">
        <svg class="brand-lockup" aria-hidden="true"><use href="#logo-lockup"/></svg>
      </a>
      <a class="docs-badge" href="/docs">Docs</a>
      <button class="search-trigger" type="button" data-search-open aria-label="Search docs">
        ${icon("i-search")}<span>Search docs</span><kbd data-search-kbd>Ctrl K</kbd>
      </button>
      <nav class="docs-links" aria-label="Site">
        <a class="docs-link" href="/">Home</a>
        <a class="btn btn--primary btn--sm" href="/app">Launch app</a>
      </nav>
    </div>
  </header>

  <div class="docs-mobilebar">
    <button class="docs-menu-btn" type="button" data-nav-toggle aria-expanded="false" aria-controls="docs-nav">
      ${icon("i-menu")}<span class="docs-menu-label">Documentation</span><b>${esc(page.navTitle)}</b>${icon("i-chevron", "chev")}
    </button>
  </div>

  <div class="docs-shell">
    <aside class="docs-sidebar" id="docs-nav" data-docs-nav aria-label="Documentation">
      <div class="docs-sidebar-inner">
        ${navHtml(page.name)}
      </div>
    </aside>

    <main class="docs-main" id="content">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="/docs">Docs</a>${icon("i-right")}<span>${page.group}</span>${page.name === "README" ? "" : `${icon("i-right")}<span aria-current="page">${esc(page.title)}</span>`}
      </nav>
      ${page.name === "README" ? `<img class="docs-banner" src="/assets/brand/paxel-banner.webp" alt="Paxel. One passport per supported asset." width="1500" height="500">` : ""}
      <h1 class="doc-title">${esc(page.title)}</h1>
      ${page.toc.length ? `<details class="toc-mobile"><summary>On this page${icon("i-chevron", "chev")}</summary><nav aria-label="On this page">${tocList(page.toc)}</nav></details>` : ""}
      <article class="prose">
${page.html}
      </article>

      <nav class="pager" aria-label="Pages">
        ${prev ? `<a class="pager-card pager-prev" href="${prev.url}"><small>${icon("i-left")}Previous</small><b>${esc(prev.navTitle)}</b></a>` : "<span></span>"}
        ${next ? `<a class="pager-card pager-next" href="${next.url}"><small>Next${icon("i-right")}</small><b>${esc(next.navTitle)}</b></a>` : "<span></span>"}
      </nav>

      <footer class="docs-foot">
        <span>© 2026 Paxel · Contracts live on ${esc(CONTRACTS.network || "Robinhood Chain")}.</span>
        <a href="#" data-back-top>Back to top</a>
      </footer>
    </main>

    <aside class="docs-toc" aria-label="On this page">
      ${page.toc.length ? `<div class="docs-toc-inner"><span class="docs-toc-title">On this page</span><nav data-toc>${tocList(page.toc)}</nav></div>` : ""}
    </aside>
  </div>

  <div class="docs-scrim" data-nav-scrim hidden></div>

  <div class="search" data-search hidden>
    <div class="search-backdrop" data-search-close></div>
    <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search docs">
      <div class="search-field">
        ${icon("i-search")}
        <input type="search" placeholder="Search the docs" autocomplete="off" spellcheck="false" data-search-input aria-controls="search-results">
        <button type="button" class="search-esc" data-search-close>Esc</button>
      </div>
      <ul class="search-results" id="search-results" role="listbox" data-search-results>
        <li class="search-empty">Type to search every page.</li>
      </ul>
    </div>
  </div>
</body>
</html>
`;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
pages.forEach((page, i) => {
  const file = page.name === "README" ? "index.html" : `${page.name}.html`;
  writeFileSync(join(OUT, file), pageHtml(page, i));
});

const index = pages.flatMap((page) =>
  page.sections
    .filter((s) => s.heading || s.text.length)
    .map((s) => ({
      page: page.title,
      group: page.group,
      heading: s.heading,
      url: s.anchor ? `${page.url}#${s.anchor}` : page.url,
      text: s.text.join(" ").replace(/\s+/g, " ").trim().slice(0, 600),
    })),
);
mkdirSync(dirname(INDEX_OUT), { recursive: true });
writeFileSync(INDEX_OUT, `// Generated by scripts/build-docs.mjs. Do not edit.\nexport default ${JSON.stringify(index)};\n`);

console.log(`docs: ${pages.length} pages, ${index.length} search entries`);
