/*
 * Paxel contract configuration for Robinhood Chain (EVM, chain id 4663).
 *
 * No Paxel contract is deployed yet, so every address is empty. Paste each 0x address here after
 * deploying, then push. The site, the app and the docs build read this file. No markup changes are needed.
 * The token CA lives on its own line in config/token.js.
 *
 * network              Network name shown to users.
 * chainId              Numeric chain id, as a string. Must match a chain in assets/js/app/chain.js.
 * tokenAddress         Token contract, from config/token.js. Drives the address bar in the hero.
 * passportRegistry     Registry that issues and stores asset passports. Also holds the roles.
 * eventLog             Append only log of passport history events.
 * accessControl        Role manager for issuers, attestors, holders and verifiers.
 * attestationRegistry  Registry of signed attestations.
 * deployBlock          Block of the passportRegistry deployment. Event scans start here.
 *
 * The app goes live once passportRegistry and eventLog both hold a valid 0x address.
 */
import { TOKEN_CA } from "./token.js";

export const CONTRACTS = {
  network: "Robinhood Chain",
  chainId: "4663",
  tokenAddress: String(TOKEN_CA ?? "").trim(),
  passportRegistry: "",
  eventLog: "",
  accessControl: "",
  attestationRegistry: "",
  deployBlock: "",
};
