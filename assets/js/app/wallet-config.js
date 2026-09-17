// Wallet connection settings for Reown AppKit (WalletConnect).
//
// The project id is public by design: it ships to the browser and is not a secret.
// VITE_WALLETCONNECT_PROJECT_ID overrides it at build time.
// Every domain the site is served from must be on the project's allowlist at
// https://dashboard.reown.com, otherwise the connect modal refuses to load.
const PAXEL_PROJECT_ID = "ff24e7c4e7d10744e3ccd080e4307cad";

export const WALLETCONNECT_PROJECT_ID =
  String(import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID ?? "").trim() || PAXEL_PROJECT_ID;

export const APP_METADATA = {
  name: "Paxel",
  description: "The permanent passport for tokenized real world assets.",
  icons: ["/favicon.svg"],
};
