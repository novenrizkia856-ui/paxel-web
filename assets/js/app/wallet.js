// Solana wallet store on top of the Wallet Standard. Phantom, Solflare, Backpack and other
// Solana wallets register themselves here, so no wallet specific SDK is needed.
//
// Only standard:connect, standard:disconnect and standard:events are used. On chain execution is
// not active: this module never asks a wallet to sign a message or a transaction.
import { isWalletAdapterCompatibleStandardWallet } from "@solana/wallet-adapter-base";
import { getWallets } from "@wallet-standard/app";

const LAST_WALLET_KEY = "paxel:wallet";

/** Wallets offered even when not installed, with where to get them. */
export const KNOWN_WALLETS = [
  { name: "Phantom", url: "https://phantom.com/download" },
  { name: "Solflare", url: "https://solflare.com/download" },
  { name: "Backpack", url: "https://backpack.app/download" },
];

const listeners = new Set();
const state = { account: "", walletName: "", walletIcon: "", connecting: false, error: "" };

let registry = null;
let current = null;
let stopEvents = null;

function emit() {
  const snapshot = getWallet();
  listeners.forEach((fn) => fn(snapshot));
}

function set(patch) {
  Object.assign(state, patch);
  emit();
}

const remember = (name) => {
  try {
    if (name) localStorage.setItem(LAST_WALLET_KEY, name);
    else localStorage.removeItem(LAST_WALLET_KEY);
  } catch {
    // Storage blocked. Auto reconnect is a convenience only.
  }
};
const remembered = () => {
  try {
    return localStorage.getItem(LAST_WALLET_KEY) || "";
  } catch {
    return "";
  }
};

const isSolana = (wallet) =>
  wallet.chains.some((chain) => chain.startsWith("solana:")) && isWalletAdapterCompatibleStandardWallet(wallet);

export function getWallet() {
  return { ...state, connected: Boolean(state.account) };
}

export function subscribeWallet(fn) {
  listeners.add(fn);
  fn(getWallet());
  return () => listeners.delete(fn);
}

/** Installed Solana wallets, then the known ones that are not installed. */
export function listWallets() {
  const installed = (registry?.get() ?? []).filter(isSolana);
  const names = new Set(installed.map((w) => w.name));
  return [
    ...installed.map((w) => ({ name: w.name, icon: w.icon, installed: true })),
    ...KNOWN_WALLETS.filter((w) => !names.has(w.name)).map((w) => ({ ...w, icon: "", installed: false })),
  ];
}

function useAccount(wallet, account) {
  if (!account) {
    current = null;
    return set({ account: "", walletName: "", walletIcon: "" });
  }
  current = wallet;
  set({ account: account.address, walletName: wallet.name, walletIcon: wallet.icon });
}

function watch(wallet) {
  stopEvents?.();
  stopEvents = wallet.features["standard:events"].on("change", ({ accounts }) => {
    if (accounts) useAccount(wallet, accounts[0]);
  });
}

async function connectTo(wallet, silent) {
  const { accounts } = await wallet.features["standard:connect"].connect(silent ? { silent: true } : undefined);
  const account = accounts[0] ?? wallet.accounts[0];
  if (!account) throw new Error("No account was shared.");
  watch(wallet);
  useAccount(wallet, account);
  remember(wallet.name);
}

export async function connectWallet(name) {
  const wallet = (registry?.get() ?? []).filter(isSolana).find((w) => w.name === name);
  if (!wallet) return;
  set({ connecting: true, error: "" });
  try {
    await connectTo(wallet, false);
  } catch (error) {
    set({ error: /reject|denied|cancel/i.test(error?.message ?? "") ? "Connection declined in your wallet." : "The wallet did not connect." });
  } finally {
    set({ connecting: false });
  }
}

export async function disconnectWallet() {
  const wallet = current;
  stopEvents?.();
  stopEvents = null;
  remember("");
  useAccount(null, null);
  try {
    await wallet?.features["standard:disconnect"]?.disconnect();
  } catch {
    // Already disconnected on the wallet side
  }
}

/** Discovers wallets and quietly restores the last connection when the wallet allows it. */
export function initWallet() {
  registry = getWallets();
  const tryRestore = () => {
    const name = remembered();
    if (!name || state.account) return;
    const wallet = registry.get().filter(isSolana).find((w) => w.name === name);
    if (wallet) connectTo(wallet, true).catch(() => {});
  };
  registry.on("register", () => {
    tryRestore();
    emit();
  });
  tryRestore();
  emit();
}
