# Identhify Web

Marketing site for Identhify, the permanent digital passport for tokenized real world assets.

Plain HTML, CSS and ES modules. No build step, no framework, no backend, no wallet or contract calls.

## Run locally

ES modules need a server. Opening `index.html` from disk will not load the scripts.

```bash
python -m http.server 5210
```

Or `npx serve .`. Then open http://localhost:5210.

## Structure

```
index.html                 Page markup. Copy for each section sits in a comment above it.
assets/css/main.css        Design tokens, layout and motion.
assets/js/main.js          Boots every module.
assets/js/contract-bar.js  Token address bar, reads config/contracts.config.js.
assets/js/nav.js           Static nav, floating glass nav, mobile menu.
assets/js/reveal.js        Scroll entrances and headline line masks.
assets/js/scroll-fx.js     Sheet rise, How it works progress line, hero parallax.
assets/js/rosette.js       Guilloché canvas art for the hero and the passport card.
assets/js/tilt.js          Pointer tilt and sheen on the passport card.
assets/img/                Favicon.
assets/fonts/              Notes on the typefaces. Fonts load from Google Fonts.
config/contracts.config.js Contract addresses. All empty for now.
vercel.json                Security headers and clean URLs only.
```

## Contracts

Every contract value lives in `config/contracts.config.js`. Nothing is hardcoded in the HTML.

| Field | Purpose |
| --- | --- |
| `network` | Network name |
| `chainId` | Chain id, as a string |
| `tokenAddress` | Token contract. Drives the bar at the top of the page. |
| `passportRegistry` | Passport registry |
| `eventLog` | Passport history log |
| `accessControl` | Role manager |
| `attestationRegistry` | Attestation registry |

While `tokenAddress` is empty the bar shows **Coming soon** and the copy button stays hidden and disabled.
Put the address in the file and redeploy. The bar shows it, shortens it on phones, and the copy button turns on.
Only `tokenAddress` is read today. The other fields are placeholders for later phases.

## Design system

Palette directions considered:

| Option | Base | Accent | Verdict |
| --- | --- | --- | --- |
| Graphite and cyan | `#111316` | `#5FE3E0` | Precise, but reads as generic crypto |
| **Obsidian and gold** | `#07070A` | `#D4B272` on bone paper `#F1EDE4` | **Chosen.** Passport foil, archive paper, guilloché |
| Ink blue and chrome | `#0A1024` | `#C9D1DC` | Institutional, colder, less artistic |

Tokens are CSS variables at the top of `assets/css/main.css`.

Type: Instrument Serif for display, Geist for body, Geist Mono for record data.

## Motion

Taken from the reference build and restyled:

- Floating glass nav. Appears past 56px when you scroll up more than 40px. Hides on scroll down.
- Mobile menu reveal. 300ms on `cubic-bezier(.87,0,.13,1)`, the reference accordion curve.
- Rounded paper sheets over a dark page, with dashed full bleed rules between blocks.
- Large radial glow orbs, 676px scaled 1.75, drifting slowly.
- Tag pills, the animated gradient badge, hover dimming on nav links, 150ms standard easing on hovers.

Added for Identhify:

- Guilloché rosette canvas in the hero. Runs at 30fps and pauses offscreen or in a hidden tab.
- Hero phone mockup built in HTML and CSS, showing the Identhify passport app. It rises in on load,
  tilts toward the pointer, and has a scan line over the passport card. On small screens it sits
  below the headline and slides under the paper sheet, like the reference device image.
- Masked headline lines and staggered fade and rise entrances.
- How it works progress line. Nodes light up and line drawings trace in as you scroll.
- Passport card with pointer tilt, moving sheen and a foil seal.
- Ecosystem marquee that pauses on hover.

`prefers-reduced-motion` turns animation off and shows all content at once.
If the scripts fail to load, an inline fallback reveals the page after 2.5 seconds.

## Copy rules

Short statements. One idea per sentence. Headlines under eight words. Supporting lines under twenty.
No dashes or semicolons in visible text.

## Placeholder links

Docs, GitHub, X and Telegram use `href="#"` with `data-placeholder`. Clicking one shows a small
"Link coming soon" toast. Replace the `href` and remove the attribute when the real links exist.

## Deploy to Vercel

Import the repo. Leave the framework preset as **Other**. No build command and no output directory.
Vercel serves the root as static files.
