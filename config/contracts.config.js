/*
 * Paxel contract configuration.
 *
 * Every value is an empty string until the contracts are deployed.
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
  network: "",
  chainId: "",
  tokenAddress: "",
  passportRegistry: "",
  eventLog: "",
  accessControl: "",
  attestationRegistry: ""
};
