// Wallet store on top of Reown AppKit. AppKit loads after first paint.
import { ACTIVE_CHAIN } from "./chain.js";

const listeners = new Set();
const state = { account: "", chainId: 0, connecting: false, loading: true, error: "" };

let kit = null;
let kitPromise = null;

function emit() {
  const snapshot = getWallet();
  listeners.forEach((fn) => fn(snapshot));
}

function set(patch) {
  Object.assign(state, patch);
  emit();
}

export function getWallet() {
  return {
    ...state,
    connected: Boolean(state.account),
    onChain: Boolean(ACTIVE_CHAIN) && state.chainId === ACTIVE_CHAIN.id,
  };
}

export function subscribeWallet(fn) {
  listeners.add(fn);
  fn(getWallet());
  return () => listeners.delete(fn);
}

function loadKit() {
  if (!kitPromise) {
    kitPromise = Promise.all([import("./appkit.js"), import("@wagmi/core")])
      .then(([appkit, core]) => {
        kit = { ...appkit, core };
        const sync = (account) => set({ account: account.address || "", chainId: account.chainId || 0, loading: false });
        sync(core.getAccount(appkit.wagmiConfig));
        core.watchAccount(appkit.wagmiConfig, { onChange: sync });
        appkit.modal.subscribeState(({ open }) => set({ connecting: Boolean(open) && !state.account }));
        return kit;
      })
      .catch((error) => {
        kitPromise = null;
        set({ loading: false, error: "The wallet modal could not load." });
        throw error;
      });
  }
  return kitPromise;
}

export function initWallet() {
  if (!ACTIVE_CHAIN) return set({ loading: false });
  const go = () => loadKit().catch(() => {});
  if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1500 });
  else setTimeout(go, 200);
}

export async function connectWallet() {
  set({ error: "" });
  try {
    const { modal } = await loadKit();
    await modal.open({ view: "Connect" });
  } catch {
    // loadKit already recorded the error
  }
}

export async function openAccount() {
  const { modal } = await loadKit();
  await modal.open({ view: "Account" });
}

export async function switchNetwork() {
  set({ error: "" });
  const { core, wagmiConfig } = await loadKit();
  await core.switchChain(wagmiConfig, { chainId: ACTIVE_CHAIN.id });
}

/** Sends a contract call from the connected account. Resolves with the transaction hash. */
export async function writeContract(request) {
  const { core, wagmiConfig } = await loadKit();
  return core.writeContract(wagmiConfig, { ...request, account: state.account, chainId: ACTIVE_CHAIN.id });
}
