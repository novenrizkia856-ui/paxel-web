/*
 * Paxel contract configuration.
 *
 * Deployed to Robinhood Chain mainnet (chain id 4663). tokenAddress and attestationRegistry stay
 * empty: there is no token yet and attestations are not built in this phase.
 * The site reads this file at runtime. No markup changes are needed.
 *
 * network              Network name shown to users, for example the chain name.
 * chainId              Numeric chain id, as a string.
 * tokenAddress         Token contract. Drives the address bar at the top of the page.
 * passportRegistry     Registry that issues and stores asset passports.
 * eventLog             Append only log of passport history events.
 * accessControl        Role manager for issuers, attestors, holders and verifiers.
 * attestationRegistry  Registry of signed attestations.
 */
export const CONTRACTS = {
  network: "Robinhood Chain",
  chainId: "4663",
  tokenAddress: "",
  passportRegistry: "0x864427fd9De98a71eFFd239178726254E83054ed",
  eventLog: "0xB783c3b4119b2ed1290BC827727D1Aab8Ea6D985",
  accessControl: "0x864427fd9De98a71eFFd239178726254E83054ed",
  attestationRegistry: ""
};
