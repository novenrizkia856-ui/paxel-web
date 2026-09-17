# Paxel Web

Landing site and passport console for Paxel, the permanent digital passport for tokenized real world assets.

Vite with plain HTML, CSS and ES modules. No framework, no backend. Two pages:

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Landing page |
| `/app` | `app.html` | Passport console: look up passports, issuer actions, issuer role management |
| any other | `public/404.html` | Not found page, served by Vercel |

## Run locally

Requires Node 22.

```bash
npm install
npm run dev
```

Then open http://localhost:5173 and http://localhost:5173/app.html. `npm run build` writes the site to
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
public/                    Favicon, robots.txt and the 404 page.
config/contracts.config.js Network and contract addresses.
vite.config.js             Two page build. Hashed bundles go to /bundle.
vercel.json                Vite build, clean URLs, cache and security headers.
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
Once `passportRegistry` is set, the hero note and footer say the contracts are live on `network`, and the
note button links to the registry on the block explorer for `chainId`. `tokenAddress` and
`attestationRegistry` are not used yet.

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
- **Manage issuers.** Visible only to the registry admin. Grant or revoke `ISSUER_ROLE` and check any address.

The ABIs in `assets/js/app/abi.js` come from `paxel-contracts/out`. Regenerate them if the contracts change.

### Current deployment

Robinhood Chain mainnet, chain id 4663.

| Contract | Address |
| --- | --- |
| PaxelRegistry (`passportRegistry`, `accessControl`) | [`0x864427fd9De98a71eFFd239178726254E83054ed`](https://robinhoodchain.blockscout.com/address/0x864427fd9De98a71eFFd239178726254E83054ed) |
| PaxelEventLog (`eventLog`) | [`0xB783c3b4119b2ed1290BC827727D1Aab8Ea6D985`](https://robinhoodchain.blockscout.com/address/0xB783c3b4119b2ed1290BC827727D1Aab8Ea6D985) |

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

1. Import the repository in Vercel. `vercel.json` sets the Vite framework, `npm ci`, `npm run build` and `dist`
   as the output directory. Node 22 comes from `package.json`.
2. No environment variables are required. Optional, both public:
   `VITE_WALLETCONNECT_PROJECT_ID` and `VITE_RPC_URL` (see `.env.example`).
3. After the first deploy, add the Vercel domain to the Reown project allowlist.

Hashed bundles under `/bundle` are cached for a year. Images and videos under `/assets` are cached for a day.
