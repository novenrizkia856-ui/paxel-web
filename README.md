# Paxel Web

Landing site and passport console for Paxel, the permanent digital passport for tokenized real world assets.

Vite with plain HTML, CSS and ES modules. No framework, no backend. Two pages:

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Landing page |
| `/app` | `app.html` | Passport console: look up passports, issuer actions, issuer role management |
| `/docs` | `docs/*.html`, generated | Documentation, built from `content/docs/*.md` |
| any other | `public/404.html` | Not found page, served by Vercel |

## Run locally

Requires Node 22.

```bash
npm install
npm run dev
```

Then open http://localhost:5173, http://localhost:5173/app.html and http://localhost:5173/docs/. `npm run build` writes the site to
`dist`, and `npm run preview` serves that build.

## Structure

```
index.html                 Landing markup. Copy for each section sits in a comment above it.
app.html                   Passport console markup.
assets/css/main.css        Design tokens, layout and motion.
assets/css/app.css         Console styles. Imports main.css for tokens and buttons.
assets/js/main.js          Boots every landing module.
assets/js/contract-bar.js  Token address block in the hero, reads config/contracts.config.js.
assets/js/nav.js           Static nav, floating glass nav, mobile menu.
assets/js/reveal.js        Fade and rise entrances on scroll.
assets/js/tilt.js          Pointer tilt on the passport preview card.
assets/js/play.js          Runs looping scenes and videos only while they are on screen.
assets/js/hero-fx.js       Hero passport card: cursor tilt, sheen, floating objects, orbiting dust.
assets/js/ring.js          Hands section: dust stream, objects riding the loop, hands closing in.
assets/js/ring-data.js     Loop path and object positions traced from the hands illustration.
assets/js/scroll-fx.js     Section transitions. Sets --p on [data-fx] elements as they scroll in.
assets/js/app/app.js       Console page: look up, recent passports, issuer and admin forms.
assets/js/app/paxel.js     Contract client. Reads over the public RPC, writes simulate first, then send.
assets/js/app/wallet.js    Wallet store on Reown AppKit, loaded after first paint.
assets/js/app/appkit.js    AppKit and wagmi setup for the active chain.
assets/js/app/wallet-config.js  WalletConnect project id and app metadata.
assets/js/app/chain.js     RPC, explorer and deploy block per chain id.
assets/js/app/abi.js       PaxelRegistry and PaxelEventLog ABIs from paxel-contracts.
public/assets/img/         Hands illustration, stickers and cut out objects.
public/assets/media/       Looping videos (mp4) and their poster images.
public/assets/brand/       Logo, mark, banner and social card. See Brand assets.
public/                    Favicon, app icon, robots.txt and the 404 page.
content/docs/               Docs source, one markdown file per page.
scripts/build-docs.mjs     Renders content/docs into docs/*.html and the search index. Runs before dev and build.
assets/css/docs.css        Docs layout: sidebar, article, on this page, search.
assets/js/docs/docs.js     Docs behaviour: mobile menu, section highlighting, code copy, search.
config/contracts.config.js Network and contract addresses.
vite.config.js             Two page build. Hashed bundles go to /bundle.
vercel.json                Vite build, clean URLs, cache and security headers.
```

## Brand assets

Everything lives in `public/assets/brand/`. The page chrome uses the vector versions; the PNGs are there for
anything off the site (decks, partner kits, app stores).

| File | Use |
| --- | --- |
| `paxel-logo.svg` | Full lockup. Orange mark, wordmark in `currentColor`, so it works on light and dark. |
| `paxel-logo-white.svg` | Full lockup, all white, for dark or orange surfaces. |
| `paxel-mark.svg` | Mark on its own, in `currentColor`. |
| `paxel-mark-orange.svg` | Mark locked to brand orange. |
| `paxel-logo-light/dark/mono-white.png` | Raster lockups at 1200px, for anything that cannot take SVG. |
| `paxel-mark-black/orange/white.png` | Raster marks at 640px. |
| `paxel-banner.webp` / `.png` | 3:1 brand banner. On the docs home, and sized for an X header. |
| `paxel-og.png` | 1200x630 social card, referenced by `og:image` and `twitter:image`. |
| `icon-192.png`, `icon-512.png` | App icons, white mark on an orange tile. |

`public/favicon.svg` and `public/apple-touch-icon.png` carry the same orange tile.

In the pages the logo is an SVG sprite, not an `<img>`. Two symbols are defined once per entry point
(`index.html`, `app.html`, the template in `scripts/build-docs.mjs`):

- `#logo-lockup` — mark plus wordmark, for the header and footer brand. Class `.brand-lockup`.
- `#logo` — the mark alone, for illustrations and small spots. Class `.brand-logo`.

Both take their colour from the element that uses them, so a white mark on a dark surface is
`<use href="#logo" color="#fff"/>` and nothing else. The mark is 1.593:1 and the lockup 4.231:1, so
any new placement needs a box in that ratio, not a square. Brand orange is `#FF6702`, the `--brand` token
in `assets/css/main.css`.

`og:image` and `twitter:image` are site relative. Once the production domain is fixed, make them absolute
so every crawler resolves them.

## Contracts

Every contract value lives in `config/contracts.config.js`, except the token CA, which sits on one line in
`config/token.js`. Nothing is hardcoded in the HTML. No Paxel contract is deployed yet, so every address is empty.

| Field | Purpose |
| --- | --- |
| `network` | Network name |
| `chainId` | Chain id, as a string |
| `tokenAddress` | Token contract, read from `TOKEN_CA` in `config/token.js`. Drives the bar in the hero. |
| `passportRegistry` | Passport registry. Also holds the roles. |
| `eventLog` | Passport history log |
| `accessControl` | Role manager |
| `attestationRegistry` | Attestation registry |
| `deployBlock` | Block of the registry deployment. Recent passports are scanned from here. |

### Launch checklist

1. Token: change `export const TOKEN_CA = null;` in `config/token.js` to the address in quotes, then push.
   While it is `null` the hero shows **Coming soon**. Any other value shows as is, with a copy button.
   A valid 0x address also links to the token on Blockscout.
2. Contracts: after `bash deploy-mainnet.sh` in paxel-contracts, run `npm run contracts:sync` here, then
   push. It copies every address and the deploy block from `paxel-contracts/deployments/mainnet.json` into
   `config/contracts.config.js`. Once the registry and event log are valid 0x addresses, the app
   goes live, the hero note and footers say the contracts are live on `network`, and the docs list the addresses.
   Until then the app shows that the contracts are not deployed yet and keeps every action disabled.

### Wallet

The console connects wallets through Reown AppKit (WalletConnect): browser extensions, the WalletConnect
QR code and mobile wallets, with a network switch to Robinhood Chain. The Paxel project id
`ff24e7c4e7d10744e3ccd080e4307cad` is set in `assets/js/app/wallet-config.js`.
`VITE_WALLETCONNECT_PROJECT_ID` overrides it at build time.

Add every domain the site runs on (the Vercel domain, any custom domain, and `localhost` for development)
to the project's allowlist at https://dashboard.reown.com. Without it the connect modal refuses to load.

The landing page never loads AppKit. It only links to the console.

### Passport console

- **Look up a passport.** No wallet needed. Enter an asset reference (hashed with keccak256 into the asset
  id) or a 0x asset id. Shows status, issuer, tokenization time, metadata URI and the full history.
  `app.html?asset=<reference or id>` opens a passport directly.
- **Recent passports.** The latest `AssetRegistered` events since the registry deploy block.
- **Issuer console.** Register, publish, update status and record events. Event data can be a file, text or a
  0x hash. Files are hashed in the browser and never uploaded. Every write is simulated first, so a call
  that would revert shows a plain explanation before the wallet opens.
- **Verification levels.** Each history entry shows L0 self reported, L1 attested or L2 multi attested,
  read from the attestation registry, and the passport lists every attestation, revoked ones included.
- **Verifier console.** Shown once `attestationRegistry` is set. Holders of `VERIFIER_ROLE` attest a fact
  (usually the data hash of a history entry) with an evidence hash, or revoke their own attestation.
- **Manage roles.** Visible only to the registry admin. Grant or revoke `ISSUER_ROLE` or `VERIFIER_ROLE`
  and check any address.

The ABIs in `assets/js/app/abi.js` come from `paxel-contracts/out`. Regenerate them if the contracts change.

### Current deployment

Robinhood Chain mainnet, chain id 4663, deployed 2026-10-12. Addresses are in `config/contracts.config.js`
and in `paxel-contracts/deployments/mainnet.json`.

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

## Docs

Pages live in `content/docs` as markdown. `scripts/build-docs.mjs` renders them into `docs/` (gitignored)
with a layout modelled on the ethereum.org developer docs: grouped navigation on the left, the article in
the middle, an on this page list on the right, previous and next cards, and search (Ctrl K or /). Below
1024px the navigation opens from a sticky Documentation bar and the on this page list folds into the article.

- Sidebar groups and page order are set in `GROUPS` at the top of the script. Every markdown file must be listed.
- Titles come from `content/docs/SUMMARY.md`.
- Links to `other-page.md` become `/docs/other-page`.
- `{{passportRegistry}}`, `{{eventLog}}`, `{{network}}` and the other config keys are filled from
  `config/contracts.config.js`. `live-contracts.md` uses them.
- The two mermaid diagrams (lifecycle and architecture) render as responsive HTML diagrams defined in the script.
- Visible docs text follows the copy rules below, so hyphenated words are written as separate words.

## Placeholder links

None left. The hero "Follow the build" button starts with `data-placeholder` and turns into a link to the
registry on Blockscout once the contracts are set. Any link with `data-placeholder` shows a "Link coming soon" toast.

## Deploy to Vercel

1. Import the repository in Vercel. `vercel.json` sets the Vite framework, `npm ci`, `npm run build` and `dist`
   as the output directory. Node 22 comes from `package.json`.
2. No environment variables are required. Optional, both public:
   `VITE_WALLETCONNECT_PROJECT_ID` and `VITE_RPC_URL` (see `.env.example`).
3. After the first deploy, add the Vercel domain to the Reown project allowlist.

Hashed bundles under `/bundle` are cached for a year. Images and videos under `/assets` are cached for a day.
