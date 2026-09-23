/*
 * Paxel Solana configuration. Every network, program, token and explorer value lives here.
 *
 * The site, the app and the docs build all read this file. No markup changes are needed.
 * Each value can be overridden at build time with the VITE_ variable next to it (see .env.example).
 * Everything here ends up in the browser bundle: public values only, never keys or secrets.
 *
 * network      Solana cluster: mainnet-beta, devnet or testnet.      VITE_SOLANA_NETWORK
 * rpcUrl       JSON RPC endpoint. Empty uses the default below.       VITE_SOLANA_RPC_URL
 * explorerUrl  Explorer base URL. Links add ?cluster= off mainnet.    VITE_SOLANA_EXPLORER_URL
 * programId    Paxel program id. Empty until a program is deployed.   VITE_PAXEL_PROGRAM_ID
 * tokenMint    Paxel SPL token mint. Empty until the token exists.    VITE_PAXEL_TOKEN_MINT
 * treasury     Paxel treasury public key. Empty until one is set.     VITE_TREASURY_ADDRESS
 *
 * No Paxel program is deployed and on chain execution is not active: the app reads public data
 * and previews passport actions, but never asks a wallet to sign or send a transaction.
 */
const DEFAULTS = {
  network: "mainnet-beta",
  rpcUrl: "",
  explorerUrl: "https://explorer.solana.com",
  programId: "",
  tokenMint: "",
  treasury: "",
};

// api.mainnet-beta.solana.com refuses requests from browsers (HTTP 403 for any Origin), so mainnet reads
// default to PublicNode's free, keyless endpoint. Set VITE_SOLANA_RPC_URL to a managed provider for production.
export const NETWORKS = {
  "mainnet-beta": {
    name: "Solana",
    label: "Solana Mainnet Beta",
    rpcUrl: "https://solana-rpc.publicnode.com",
    cluster: "",
  },
  devnet: {
    name: "Solana Devnet",
    label: "Solana Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    cluster: "devnet",
  },
  testnet: {
    name: "Solana Testnet",
    label: "Solana Testnet",
    rpcUrl: "https://api.testnet.solana.com",
    cluster: "testnet",
  },
};

// Vite replaces import.meta.env in the browser. The docs build runs in Node and passes process.env.
const env = import.meta.env ?? globalThis.process?.env ?? {};
const read = (key, fallback) => String(env[key] ?? "").trim() || fallback;

/** Base58 check only: 32 to 44 characters, no 0, O, I or l. The app validates fully with PublicKey. */
export const isPublicKey = (value) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value ?? "").trim());
const publicKey = (key, fallback) => {
  const value = read(key, fallback);
  return isPublicKey(value) ? value : "";
};

const networkKey = read("VITE_SOLANA_NETWORK", DEFAULTS.network);

export const NETWORK = NETWORKS[networkKey] ?? NETWORKS[DEFAULTS.network];

export const SOLANA = {
  network: NETWORKS[networkKey] ? networkKey : DEFAULTS.network,
  rpcUrl: read("VITE_SOLANA_RPC_URL", DEFAULTS.rpcUrl) || NETWORK.rpcUrl,
  explorerUrl: read("VITE_SOLANA_EXPLORER_URL", DEFAULTS.explorerUrl).replace(/\/+$/, ""),
  programId: publicKey("VITE_PAXEL_PROGRAM_ID", DEFAULTS.programId),
  tokenMint: publicKey("VITE_PAXEL_TOKEN_MINT", DEFAULTS.tokenMint),
  treasury: publicKey("VITE_TREASURY_ADDRESS", DEFAULTS.treasury),
};

export const PROGRAM_DEPLOYED = Boolean(SOLANA.programId);
export const TOKEN_LIVE = Boolean(SOLANA.tokenMint);

/** Explorer link for an account ("address") or a transaction signature ("tx"). */
export function explorerLink(kind, value) {
  if (!value) return "";
  const url = new URL(`${SOLANA.explorerUrl}/${kind}/${value}`);
  if (NETWORK.cluster) url.searchParams.set("cluster", NETWORK.cluster);
  return url.href;
}

/** Deploy status lines shared by the landing page, the app and the docs. */
export const DEPLOY_COPY = PROGRAM_DEPLOYED
  ? { note: `The Paxel program is live on ${NETWORK.name}.`, legal: `Program live on ${NETWORK.name}.` }
  : { note: "Built for Solana. The program is not live yet.", legal: "Built for Solana. Not yet deployed." };
