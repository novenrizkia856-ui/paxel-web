// Reown AppKit setup. Loaded lazily by wallet.js so the first paint stays light.
// Covers browser extensions (EIP 6963), the WalletConnect QR code and mobile deep links.
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit";
import { defineChain } from "@reown/appkit/networks";
import { http } from "@wagmi/core";
import { ACTIVE_CHAIN } from "./chain.js";
import { APP_METADATA, WALLETCONNECT_PROJECT_ID } from "./wallet-config.js";

export const network = defineChain({
  id: ACTIVE_CHAIN.id,
  caipNetworkId: `eip155:${ACTIVE_CHAIN.id}`,
  chainNamespace: "eip155",
  name: ACTIVE_CHAIN.name,
  nativeCurrency: ACTIVE_CHAIN.nativeCurrency,
  rpcUrls: { default: { http: [ACTIVE_CHAIN.rpcUrl] } },
  blockExplorers: { default: { name: "Blockscout", url: ACTIVE_CHAIN.explorerUrl } },
});

export const adapter = new WagmiAdapter({
  projectId: WALLETCONNECT_PROJECT_ID,
  networks: [network],
  transports: { [network.id]: http(ACTIVE_CHAIN.rpcUrl) },
});

export const wagmiConfig = adapter.wagmiConfig;

const origin = window.location.origin;

export const modal = createAppKit({
  adapters: [adapter],
  projectId: WALLETCONNECT_PROJECT_ID,
  networks: [network],
  defaultNetwork: network,
  metadata: { ...APP_METADATA, url: origin, icons: APP_METADATA.icons.map((p) => new URL(p, origin).href) },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#0b0b0d",
    "--w3m-color-mix": "#c9b28a",
    "--w3m-color-mix-strength": 8,
    "--w3m-font-family": "Manrope, -apple-system, 'Segoe UI', system-ui, sans-serif",
    "--w3m-border-radius-master": "3px",
    "--w3m-z-index": 1000,
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
    swaps: false,
    onramp: false,
    send: false,
    receive: false,
    history: false,
  },
});
