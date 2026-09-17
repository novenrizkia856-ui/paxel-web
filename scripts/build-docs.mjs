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
    <defs>
      <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E3036"/><stop offset="1" stop-color="#0B0B0D"/></linearGradient>
      <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F1E6CF"/><stop offset=".5" stop-color="#C9B28A"/><stop offset="1" stop-color="#A88F63"/></linearGradient>
    </defs>
    <symbol id="logo" viewBox="0 0 32 32"><path d="M16 0C3.6 0 0 3.6 0 16s3.6 16 16 16 16-3.6 16-16S28.4 0 16 0z" fill="url(#logo-grad)"/><path fill="url(#logo-gold)" fill-rule="evenodd" d="M10.5 7.5h6.8a5.6 5.6 0 0 1 0 11.2h-3v5.8h-3.8zm3.8 3.4v4.4h2.8a2.2 2.2 0 0 0 0-4.4z"/></symbol>
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
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
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
    Header: paxel. Docs. Search docs. Ctrl K. Home. Launch app.
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
        <svg class="brand-logo" aria-hidden="true"><use href="#logo"/></svg><span>paxel</span>
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
