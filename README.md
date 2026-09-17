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
assets/js/contract-bar.js  Token address block in the hero, reads config/contracts.config.js.
assets/js/nav.js           Static nav, floating glass nav, mobile menu.
assets/js/reveal.js        Fade and rise entrances on scroll.
assets/js/tilt.js          Pointer tilt on the passport preview card.
assets/js/play.js          Runs looping scenes and videos only while they are on screen.
assets/js/hero-fx.js       Hero passport card: cursor tilt, sheen, floating objects, orbiting dust.
assets/js/ring.js          Hands section: dust stream, objects riding the loop, hands closing in.
assets/js/ring-data.js     Loop path and object positions traced from the hands illustration.
assets/js/scroll-fx.js     Section transitions. Sets --p on [data-fx] elements as they scroll in.
assets/img/                Favicon and the layered hands illustration.
assets/img/stickers/       High resolution sticker icons.
assets/img/objects/        Coins, gems, frames and planets cut out of the illustrations.
assets/media/              Looping videos (mp4) and their poster images.
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

While `tokenAddress` is empty the hero shows **Coming soon** and the copy button stays hidden and disabled.
Put the address in the file and redeploy. The hero shows the short form, and the copy button copies the full address.
Only `tokenAddress` is read today. The other fields are placeholders for later phases.

## Design system

Restrained and institutional. White pages with obsidian type, graphite structure, champagne gold accents
and platinum lines.

| Token | Value | Use |
| --- | --- | --- |
| Obsidian | `#0B0B0D` | Type, the passport card, the dark preview band |
| Graphite | `#2E3036`, `#4A4D55`, `#6E7078` | Secondary type, icons, quiet surfaces |
| Champagne gold | `#C9B28A`, deep `#A88F63`, light `#E9DDC6` | Primary button, chip, accents |
| Platinum | `#E4E3DF`, light `#F4F3EF` | Borders, dividers, quiet fills |
| White | `#FFFFFF` | Page background |

Type: Manrope. JetBrains Mono for addresses and ids.

The reused illustrations (stickers, objects, hands) are toned to champagne and graphite in the image files
themselves, and the eyes and crowd videos get a matching sepia filter, so the page reads as one system.

Tokens are CSS variables at the top of `assets/css/main.css`.

## Layout and motion

- White hero. The token contract address sits below the supporting line.
- A large obsidian passport card with a champagne chip floats, tilts toward the cursor and catches the light.
  Toned illustration objects drift around the card only, and fine champagne dust orbits it.
  On scroll the copy lifts away and the card sinks back.
- White rounded sheets rise over the section above as you scroll. The problem block sits inside the hands
  illustration: gold dust streams along the loop, the coins and gems ride it, and the hands close in.
  Then a sticker icon grid and four feature blocks for How it works that lift into place.
  Each block has an accent tag, a dashed info card and its own looping SVG scene with printed grain, hard
  shadows, stickers and floating objects: a wand issues and stamps a passport, three signers attest,
  events stack while a bell rings and a lock closes, and a magnifier verifies a passport.
- Dark passport preview band framed by the watching eyes and crowd animations, with a sample record card.
  The eyes zoom in as the band arrives.
- Headlines rise word by word.
- Second sheet with role cards, an ecosystem split and a three column dashed grid.
- Dark closing call to action and a dashed footer grid.
- Floating glass nav appears past 56px when you scroll up more than 40px.
- Mobile menu opens over 300ms on `cubic-bezier(.87,0,.13,1)`. Hovers use 150ms standard easing.

`prefers-reduced-motion` turns animation off, shows every scene in its finished state and keeps videos on their posters.
If the scripts fail to load, an inline fallback reveals the page after 2.5 seconds.

## Copy rules

Short statements. One idea per sentence. Headlines under eight words. Supporting lines under twenty.
No dashes or semicolons in visible text.

## Placeholder links

Docs, Learn more and Telegram use `href="#"` with `data-placeholder`. Clicking one shows a small
"Link coming soon" toast. Replace the `href` and remove the attribute when the real links exist.

## Deploy to Vercel

Import the repo. Leave the framework preset as **Other**. No build command and no output directory.
Vercel serves the root as static files.
