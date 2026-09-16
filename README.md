# Paxel Web

Marketing site for Paxel, the permanent digital passport for tokenized real world assets.

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
assets/js/reveal.js        Fade and rise entrances on scroll.
assets/js/tilt.js          Pointer tilt on the passport preview card.
assets/img/                Favicon, sticker icons and the hands illustration.
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

The look follows the reference build the team contributed to. Paxel keeps its own name, logo, copy and UI.

Reused reference assets, all without third party branding: the sticker icons (`sticker-*.webp`) and the
hands illustration (`illustration-hands*.webp`). Reference images that show another brand's logo, name or
app screens are not used. The device mockups and app windows are HTML and CSS with Paxel content.

| Token | Value | Use |
| --- | --- | --- |
| Navy | `#09101C`, `#131D2F`, `#1B273D` | Page, dark buttons, dashed lines on dark |
| White sheets | `#FFFFFF`, 24px radius | Content panels over the navy page |
| Blue | `#2A4AF5` | Primary buttons |
| Purple | `#7140FD` | Contract address bar, Attest accent |
| Orange, teal | `#F6B03C`, `#2A799B` | Issue and Record accents |
| Neutrals | `#647084`, `#A1ABBD`, `#DCE0E5`, `#E7EAEE`, `#F0F2F5` | Secondary text, borders |

Type: Inter. Scale 13, 15, 19, 27, 40, 64, 88 with the reference tracking. JetBrains Mono for hashes.

Tokens are CSS variables at the top of `assets/css/main.css`.

## Layout and motion

- Purple bar on top carries the token contract address.
- Dark hero with a laptop and phone mockup built in HTML and CSS, showing the Paxel app.
- White rounded sheets. The problem block sits inside the hands illustration, then a sticker icon grid,
  then four feature blocks for How it works.
  Each block has an accent tag, a dashed info card, a tinted desktop app window and a soft glow.
- Dark passport preview band with sparkles and a sample record card that tilts on hover.
- Second sheet with role cards, an ecosystem split and a three column dashed grid.
- Dark closing call to action and a dashed footer grid.
- Floating glass nav appears past 56px when you scroll up more than 40px.
- Mobile menu opens over 300ms on `cubic-bezier(.87,0,.13,1)`. Hovers use 150ms standard easing.

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
