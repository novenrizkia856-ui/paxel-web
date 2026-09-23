import { DEPLOY_COPY, NETWORK, SOLANA, explorerLink } from "../../../config/solana.config.js";
import { EVENT_TYPES, NOT_LIVE, STATUSES, hashFile, hashText, isAssetId, toAssetId } from "./paxel.js";
import { isValidPublicKey, readSolBalance, readTokenBalance } from "./solana.js";
import { connectWallet, disconnectWallet, getWallet, initWallet, listWallets, subscribeWallet } from "./wallet.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const short = (value, head = 4, tail = 4) => (value ? `${value.slice(0, head)}…${value.slice(-tail)}` : "");
const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const amount = (value, max = 4) => value.toLocaleString("en", { maximumFractionDigits: max });

/* Toast */
let toastTimer;
function toast(message) {
  const el = $("[data-toast]");
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied");
  } catch {
    toast("Copy failed");
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-copy]");
  if (button) copy(button.dataset.copy);
});

/* Wallet */
let wallet = getWallet();
const dialog = $("[data-wallet-dialog]");

function renderWallet() {
  const button = $("[data-wallet]");
  const badge = $("[data-net-badge]");
  let label = "Connect wallet";
  if (wallet.connecting) label = "Waiting for wallet";
  else if (wallet.connected) label = short(wallet.account);
  button.textContent = label;
  button.title = wallet.connected ? wallet.account : "";
  button.classList.toggle("btn--primary", !wallet.connected);
  button.classList.toggle("btn--outline-dark", wallet.connected);

  badge.classList.toggle("is-live", wallet.connected);
  $("[data-net-label]").textContent = NETWORK.name;

  const gate = $("[data-gate]");
  gate.textContent = wallet.connected
    ? `${NOT_LIVE} Actions are checked and previewed, never signed or sent.`
    : "Connect a Solana wallet to preview passport actions.";

  $("[data-role-pill]").textContent = wallet.connected ? "Preview only" : "Not connected";

  $$("[data-action] button[type=submit]").forEach((b) => {
    b.disabled = !wallet.connected;
  });

  if (dialog.open) renderDialog();
}

const walletIcon = (item) =>
  /^data:image\//.test(item.icon ?? "")
    ? `<img src="${esc(item.icon)}" alt="" width="32" height="32">`
    : `<span class="wallet-glyph" aria-hidden="true">${esc(item.name.charAt(0))}</span>`;

function renderPicker() {
  $("[data-wallet-list]").innerHTML = listWallets()
    .map((item) =>
      item.installed
        ? `<li><button class="wallet-option" type="button" data-connect="${esc(item.name)}">${walletIcon(item)}<span>${esc(item.name)}</span><small>Detected</small></button></li>`
        : `<li><a class="wallet-option" href="${esc(item.url)}" target="_blank" rel="noopener">${walletIcon(item)}<span>${esc(item.name)}</span><small>Install</small></a></li>`,
    )
    .join("");
}

let balanceFor = "";
async function renderBalances() {
  const account = wallet.account;
  if (balanceFor === account) return;
  balanceFor = account;
  const sol = $("[data-wallet-sol]");
  const token = $("[data-wallet-token]");
  sol.textContent = "Loading";
  token.textContent = "Loading";
  try {
    const value = await readSolBalance(account);
    if (balanceFor === account) sol.textContent = `${amount(value)} SOL`;
  } catch {
    if (balanceFor === account) sol.textContent = "Unavailable right now";
  }
  if (!SOLANA.tokenMint) return;
  try {
    const value = await readTokenBalance(account, SOLANA.tokenMint);
    if (balanceFor === account) token.textContent = amount(value);
  } catch {
    if (balanceFor === account) token.textContent = "Unavailable right now";
  }
}

function renderDialog() {
  const connected = wallet.connected;
  $("[data-wallet-title]").textContent = connected ? "Wallet" : "Connect a Solana wallet";
  $('[data-wallet-view="pick"]').hidden = connected;
  $('[data-wallet-view="account"]').hidden = !connected;
  if (!connected) {
    balanceFor = "";
    return renderPicker();
  }
  const icon = /^data:image\//.test(wallet.walletIcon) ? `<img src="${esc(wallet.walletIcon)}" alt="" width="28" height="28">` : "";
  $("[data-wallet-id]").innerHTML = `${icon}<span>${esc(wallet.walletName)}</span>`;
  const key = $("[data-wallet-key]");
  key.textContent = short(wallet.account, 6, 6);
  key.dataset.copy = wallet.account;
  $("[data-wallet-net]").textContent = NETWORK.label;
  $("[data-wallet-token-row]").hidden = !SOLANA.tokenMint;
  $("[data-wallet-explorer]").href = explorerLink("address", wallet.account);
  renderBalances();
}

function openDialog() {
  renderDialog();
  if (!dialog.open) dialog.showModal();
}

function initWalletUi() {
  let lastError = "";
  subscribeWallet((next) => {
    const justConnected = next.connected && !wallet.connected;
    wallet = next;
    if (next.error && next.error !== lastError) toast(next.error);
    lastError = next.error;
    if (justConnected && dialog.open) dialog.close();
    renderWallet();
  });
  $("[data-wallet]").addEventListener("click", openDialog);
  $("[data-wallet-close]").addEventListener("click", () => dialog.close());
  // A click on the backdrop lands on the dialog itself, outside its box
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close();
  });
  $("[data-wallet-list]").addEventListener("click", (event) => {
    const option = event.target.closest("[data-connect]");
    if (option) connectWallet(option.dataset.connect);
  });
  $("[data-wallet-disconnect]").addEventListener("click", async () => {
    await disconnectWallet();
    dialog.close();
    toast("Wallet disconnected");
  });
  initWallet();
}

/* Look up */
let lookupToken = 0;
async function lookup(input, { updateUrl = true } = {}) {
  const box = $("[data-lookup-result]");
  const token = ++lookupToken;
  const assetId = await toAssetId(input);
  if (token !== lookupToken) return;
  if (!assetId) {
    box.innerHTML = `<p class="result-note">Enter an asset reference or id.</p>`;
    return;
  }
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("asset", String(input).trim());
    history.replaceState(null, "", url);
  }
  box.innerHTML = `<p class="result-note">The Solana passport registry is not live yet, so this passport cannot be read on chain.<br><button class="hash-chip mono" type="button" data-copy="${assetId}" title="Copy asset id">${short(assetId, 10, 8)}</button></p>`;
}

async function previewId(input, target, fallback = "") {
  const value = input.value.trim();
  if (!value) target.textContent = fallback;
  else if (isAssetId(value)) target.textContent = "Using this id as is.";
  else {
    const id = await toAssetId(value);
    if (input.value.trim() === value) target.textContent = `Asset id ${short(id, 10, 8)}`;
  }
}

function initLookup() {
  const form = $("[data-lookup-form]");
  const input = $("[data-asset-input]");
  const preview = $("[data-asset-preview]");
  const hint = preview.textContent;
  input.addEventListener("input", () => previewId(input, preview, hint));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    lookup(input.value);
  });

  const initial = new URLSearchParams(window.location.search).get("asset");
  if (initial) {
    input.value = initial;
    previewId(input, preview, hint);
    lookup(initial, { updateUrl: false });
  }
}

/* Recent passports */
function loadRecent() {
  $("[data-recent-list]").innerHTML = `<li class="empty">Passports will appear here once the Solana registry is live.</li>`;
}

function initRecent() {
  $("[data-recent-refresh]").addEventListener("click", loadRecent);
  loadRecent();
}

/* Issuer and admin actions: checked and previewed, never signed or sent */
function setStatus(form, html, tone = "") {
  const el = $("[data-status]", form);
  el.innerHTML = html;
  el.dataset.tone = tone;
}

async function eventHash(form) {
  const file = form.elements.file.files?.[0];
  if (file) return hashFile(file);
  const data = form.elements.data.value.trim();
  if (!data) return "";
  return isAssetId(data) ? data.toLowerCase() : hashText(data);
}

const idChip = (id) => `<span class="mono">${short(id, 10, 8)}</span>`;

/** Validates the form and describes the instruction it would send once execution is live. */
async function buildPreview(form) {
  const kind = form.dataset.action;
  if (kind === "role") {
    const account = form.elements.account.value.trim();
    if (!(await isValidPublicKey(account))) throw new Error("Enter a full Solana public key.");
    const verb = form.dataset.op === "revoke" ? "Revoke the issuer role from" : "Grant the issuer role to";
    return `${verb} <span class="mono">${short(account)}</span>.`;
  }

  const assetId = await toAssetId(form.elements.asset.value);
  if (!assetId) throw new Error("Enter an asset reference or id.");

  if (kind === "register") {
    const uri = form.elements.uri.value.trim();
    if (!uri) throw new Error("Enter a metadata URI.");
    return `Register ${idChip(assetId)} in Draft with metadata ${esc(uri)}. Issuer <span class="mono">${short(wallet.account)}</span>.`;
  }
  if (kind === "publish") return `Publish ${idChip(assetId)}, moving it from Draft to Issued.`;
  if (kind === "status") {
    const status = Number(form.elements.status.value);
    return `Set the status of ${idChip(assetId)} to ${STATUSES[status]}.`;
  }
  const dataHash = await eventHash(form);
  if (!dataHash) throw new Error("Add a file, text or hash for this event.");
  const type = Number(form.elements.type.value);
  return `Add a ${EVENT_TYPES[type]} event to ${idChip(assetId)} with data hash ${idChip(dataHash)}.`;
}

function initActions() {
  const statusSelect = $("[data-status-select]");
  statusSelect.innerHTML = STATUSES.slice(1).map((s, i) => `<option value="${i + 1}">${s}</option>`).join("");
  $("[data-type-select]").innerHTML = EVENT_TYPES.map((t, i) => `<option value="${i}">${t}</option>`).join("");

  $$("[data-asset-field]").forEach((field) => {
    const target = $("[data-id-preview]", field.closest(".field"));
    field.addEventListener("input", () => previewId(field, target));
  });

  const eventForm = $('[data-action="event"]');
  const hashPreview = $("[data-hash-preview]", eventForm);
  const hashHint = hashPreview.textContent;
  const updateHash = async () => {
    try {
      const hash = await eventHash(eventForm);
      hashPreview.textContent = hash ? `Data hash ${short(hash, 10, 8)}` : hashHint;
    } catch {
      hashPreview.textContent = "This file could not be read.";
    }
  };
  eventForm.elements.data.addEventListener("input", updateHash);
  eventForm.elements.file.addEventListener("change", updateHash);

  // Remember which admin button submitted the form
  $$('[data-action="role"] button[type=submit]').forEach((b) =>
    b.addEventListener("click", () => {
      b.form.dataset.op = b.value;
    }),
  );

  const roleInput = $("[data-role-account]");
  const roleCheck = $("[data-role-check]");
  roleInput.addEventListener("input", async () => {
    const account = roleInput.value.trim();
    const valid = account && (await isValidPublicKey(account));
    if (roleInput.value.trim() !== account) return;
    roleCheck.textContent = !account ? "" : valid ? "Valid Solana public key." : "Enter a full Solana public key.";
  });

  $$("[data-action]").forEach((form) =>
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!wallet.connected) return openDialog();
      try {
        const preview = await buildPreview(form);
        setStatus(form, `${preview} ${NOT_LIVE} Nothing was signed or sent.`, "info");
        toast("Live execution is currently disabled.");
      } catch (error) {
        setStatus(form, esc(error.message), "error");
      }
    }),
  );
}

/* Network, program and token chips */
const keyChip = (label, value) =>
  `<li><span>${label}</span><a class="mono" href="${explorerLink("address", value)}" target="_blank" rel="noopener" title="${esc(value)}">${short(value)}</a><button class="chip-copy" type="button" data-copy="${esc(value)}" aria-label="Copy ${label.toLowerCase()}"><svg aria-hidden="true"><use href="#i-copy"/></svg></button></li>`;

function renderChips() {
  const chips = $("[data-chain-chips]");
  chips.innerHTML = [
    `<li><span>Network</span>${NETWORK.label}</li>`,
    SOLANA.programId ? keyChip("Program", SOLANA.programId) : `<li><span>Program</span>Not deployed yet</li>`,
    SOLANA.tokenMint ? keyChip("Token mint", SOLANA.tokenMint) : `<li><span>Token mint</span>Coming soon</li>`,
  ].join("");
  $("[data-footer-network]").textContent = DEPLOY_COPY.legal;
}

renderChips();
initLookup();
initRecent();
initActions();
initWalletUi();
