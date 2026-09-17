// Chain parameters for every network Paxel is deployed on, keyed by chain id.
// Contract addresses and the active chain id come from config/contracts.config.js.
import { CONTRACTS } from "../../../config/contracts.config.js";

const env = import.meta.env ?? {};

export const CHAINS = {
  4663: {
    id: 4663,
    name: "Robinhood Chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: env.VITE_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
    explorerUrl: "https://robinhoodchain.blockscout.com",
    // Block of the PaxelRegistry deployment. Event scans start here.
    registryFromBlock: 65369953n,
  },
};

const isAddress = (value) => /^0x[0-9a-fA-F]{40}$/.test(String(value ?? "").trim());

export const REGISTRY = String(CONTRACTS.passportRegistry ?? "").trim();
export const EVENT_LOG = String(CONTRACTS.eventLog ?? "").trim();
export const ACTIVE_CHAIN = CHAINS[String(CONTRACTS.chainId ?? "").trim()] ?? null;
export const CONTRACTS_READY = Boolean(ACTIVE_CHAIN && isAddress(REGISTRY) && isAddress(EVENT_LOG));

export function explorerLink(kind, value) {
  if (!ACTIVE_CHAIN || !value) return "";
  return `${ACTIVE_CHAIN.explorerUrl}/${kind}/${value}`;
}
