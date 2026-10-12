import { ACTIVE_CHAIN, CONTRACTS_READY, EVENT_LOG, REGISTRY, explorerLink } from "./chain.js";
import {
  EVENT_TYPES,
  ISSUER_ROLE,
  STATUSES,
  explainError,
  hashFile,
  hashText,
  isAddress,
  isBytes32,
  readHistory,
  readPassport,
  readRecentPassports,
  readRoles,
  send,
  toAssetId,
} from "./paxel.js";
import { connectWallet, getWallet, initWallet, openAccount, subscribeWallet, switchNetwork } from "./wallet.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const short = (value, head = 6, tail = 4) => (value ? `${value.slice(0, head)}…${value.slice(-tail)}` : "");
const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const dateTime = (seconds) =>
  new Date(seconds * 1000).toLocaleString("en", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const addressLink = (address) =>
  `<a class="mono" href="${explorerLink("address", address)}" target="_blank" rel="noopener" title="${esc(address)}">${short(address)}</a>`;

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

/* Wallet and roles */
let wallet = getWallet();
let roles = { admin: false, issuer: false };
let rolesFor = "";

function renderWallet() {
  const button = $("[data-wallet]");
  const badge = $("[data-net-badge]");
  let label = "Connect wallet";
  if (wallet.connecting) label = "Waiting for wallet";
  else if (wallet.connected && !wallet.onChain) label = "Switch network";
  else if (wallet.connected) label = short(wallet.account);
  button.textContent = label;
  button.classList.toggle("btn--primary", !(wallet.connected && wallet.onChain));
  button.classList.toggle("btn--outline-dark", wallet.connected && wallet.onChain);

  const wrong = wallet.connected && !wallet.onChain;
  badge.classList.toggle("is-wrong", wrong);
  badge.classList.toggle("is-live", wallet.connected && wallet.onChain);
  $("[data-net-label]").textContent = wrong ? "Wrong network" : ACTIVE_CHAIN?.name ?? "No network";

  const gate = $("[data-gate]");
  const pill = $("[data-role-pill]");
  let gateText = "";
  if (!wallet.connected) gateText = "Connect a wallet to manage passports.";
  else if (!wallet.onChain) gateText = `Switch to ${ACTIVE_CHAIN.name} to continue.`;
  else if (!roles.issuer && !roles.admin) gateText = "No role yet. Ask the Paxel admin for the issuer role.";
  gate.textContent = gateText;
  gate.hidden = !gateText;

  pill.textContent = !wallet.connected
    ? "Not connected"
    : [roles.admin && "Admin", roles.issuer && "Issuer"].filter(Boolean).join(" · ") || "No role";
  pill.classList.toggle("is-on", wallet.connected && (roles.admin || roles.issuer));

  const ready = wallet.connected && wallet.onChain;
  $$("[data-action] button[type=submit]").forEach((b) => {
    b.disabled = !ready;
  });

  const showAdmin = ready && roles.admin;
  $("[data-admin-panel]").hidden = !showAdmin;
  $("[data-admin-link]").hidden = !showAdmin;
}

async function refreshRoles() {
  const account = wallet.connected ? wallet.account : "";
  if (!account) {
    roles = { admin: false, issuer: false };
    rolesFor = "";
    return renderWallet();
  }
  if (account === rolesFor) return renderWallet();
  rolesFor = account;
  try {
    roles = await readRoles(account);
  } catch {
    roles = { admin: false, issuer: false };
  }
  if (rolesFor === account) renderWallet();
}

function initWalletUi() {
  let lastError = "";
  subscribeWallet((next) => {
    wallet = next;
    if (next.error && next.error !== lastError) toast(next.error);
    lastError = next.error;
    renderWallet();
    refreshRoles();
  });
  $("[data-wallet]").addEventListener("click", async () => {
    try {
      if (!wallet.connected) await connectWallet();
      else if (!wallet.onChain) await switchNetwork();
      else await openAccount();
    } catch (error) {
      toast(explainError(error));
    }
  });
  initWallet();
}

/* Look up */
function passportCard(passport, history) {
  const uri = passport.metadataURI;
  const uriHtml = /^https?:\/\//i.test(uri)
    ? `<a href="${esc(uri)}" target="_blank" rel="noopener">${esc(uri)}</a>`
    : `<span>${esc(uri)}</span>`;
  const rows = history.length
    ? history
        .map(
          (entry, i) => `
        <li>
          <span class="h-index">${i + 1}</span>
          <div class="h-body">
            <b>${EVENT_TYPES[entry.eventType] ?? `Type ${entry.eventType}`}</b>
            <small>${dateTime(entry.timestamp)} · by ${addressLink(entry.submittedBy)}</small>
          </div>
          <button class="hash-chip mono" type="button" data-copy="${entry.dataHash}" title="Copy data hash">${short(entry.dataHash, 8, 6)}</button>
        </li>`,
        )
        .reverse()
        .join("")
    : `<li class="empty">No events recorded yet.</li>`;

  return `
    <article class="passport">
      <header class="passport-head">
        <span class="status status--${STATUSES[passport.status]?.toLowerCase()}">${STATUSES[passport.status] ?? "Unknown"}</span>
        <button class="btn btn--darkgrey btn--sm" type="button" data-use-asset="${passport.assetId}">Use in issuer console</button>
      </header>
      <dl class="passport-rows">
        <div><dt>Asset id</dt><dd><button class="hash-chip mono" type="button" data-copy="${passport.assetId}" title="Copy asset id">${short(passport.assetId, 10, 8)}</button></dd></div>
        <div><dt>Issuer</dt><dd>${addressLink(passport.issuer)}</dd></div>
        <div><dt>Tokenized</dt><dd>${dateTime(passport.tokenizedAt)}</dd></div>
        <div><dt>Metadata</dt><dd class="uri">${uriHtml}</dd></div>
      </dl>
      <div class="history">
        <div class="history-head"><h3>History</h3><span>${history.length} ${history.length === 1 ? "entry" : "entries"}</span></div>
        <ol class="history-list">${rows}</ol>
      </div>
    </article>`;
}

let lookupToken = 0;
async function lookup(input, { updateUrl = true } = {}) {
  const box = $("[data-lookup-result]");
  const assetId = toAssetId(input);
  if (!assetId) {
    box.innerHTML = `<p class="result-note">Enter an asset reference or id.</p>`;
    return;
  }
  const token = ++lookupToken;
  box.innerHTML = `<p class="result-note is-loading">Reading the passport</p>`;
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("asset", String(input).trim());
    history.replaceState(null, "", url);
  }
  try {
    const passport = await readPassport(assetId);
    if (token !== lookupToken) return;
    if (!passport) {
      box.innerHTML = `<p class="result-note">No passport found for this asset id.<br><span class="mono">${short(assetId, 10, 8)}</span></p>`;
      return;
    }
    const entries = await readHistory(assetId);
    if (token !== lookupToken) return;
    box.innerHTML = passportCard(passport, entries);
  } catch {
    if (token === lookupToken) box.innerHTML = `<p class="result-note">The network did not respond. Please try again.</p>`;
  }
}

function previewId(input, target, fallback = "") {
  const value = input.value.trim();
  if (!value) target.textContent = fallback;
  else if (isBytes32(value)) target.textContent = "Using this id as is.";
  else target.textContent = `Asset id ${short(toAssetId(value), 10, 8)}`;
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

  $("[data-lookup-result]").addEventListener("click", (event) => {
    const use = event.target.closest("[data-use-asset]");
    if (!use) return;
    $$("[data-asset-field]").forEach((field) => {
      field.value = use.dataset.useAsset;
      field.dispatchEvent(new Event("input"));
    });
    $("#issuer").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const initial = new URLSearchParams(window.location.search).get("asset");
  if (initial) {
    input.value = initial;
    previewId(input, preview, hint);
    lookup(initial, { updateUrl: false });
  }
}

/* Recent passports */
async function loadRecent() {
  const list = $("[data-recent-list]");
  list.innerHTML = `<li class="empty is-loading">Loading recent passports</li>`;
  try {
    const items = await readRecentPassports(8);
    list.innerHTML = items.length
      ? items
          .map(
            (item) => `
          <li>
            <button type="button" class="recent-item" data-recent="${item.assetId}">
              <span class="mono">${short(item.assetId, 10, 6)}</span>
              <span class="status status--${STATUSES[item.status]?.toLowerCase()}">${STATUSES[item.status]}</span>
              <small>${dateTime(item.tokenizedAt)} · ${short(item.issuer)}</small>
            </button>
          </li>`,
          )
          .join("")
      : `<li class="empty">No passports registered yet.</li>`;
  } catch {
    list.innerHTML = `<li class="empty">Recent passports could not load.</li>`;
  }
}

function initRecent() {
  $("[data-recent-refresh]").addEventListener("click", loadRecent);
  $("[data-recent-list]").addEventListener("click", (event) => {
    const item = event.target.closest("[data-recent]");
    if (!item) return;
    const input = $("[data-asset-input]");
    input.value = item.dataset.recent;
    input.dispatchEvent(new Event("input"));
    lookup(item.dataset.recent);
    $("#lookup").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  loadRecent();
}

/* Issuer and admin actions */
function setStatus(form, html, tone = "") {
  const el = $("[data-status]", form);
  el.innerHTML = html;
  el.dataset.tone = tone;
}

const txLink = (hash) => `<a href="${explorerLink("tx", hash)}" target="_blank" rel="noopener">View transaction</a>`;

async function eventHash(form) {
  const file = form.elements.file.files?.[0];
  if (file) return hashFile(file);
  const data = form.elements.data.value.trim();
  if (!data) return "";
  return isBytes32(data) ? data.toLowerCase() : hashText(data);
}

async function buildCall(form) {
  const kind = form.dataset.action;
  if (kind === "role") {
    const account = form.elements.account.value.trim();
    if (!isAddress(account)) throw new Error("Enter a valid wallet address.");
    const op = form.dataset.op === "revoke" ? "revokeRole" : "grantRole";
    return { target: "registry", functionName: op, args: [ISSUER_ROLE, account], done: op === "grantRole" ? "Issuer role granted." : "Issuer role revoked." };
  }

  const assetId = toAssetId(form.elements.asset.value);
  if (!assetId) throw new Error("Enter an asset reference or id.");

  if (kind === "register") {
    const uri = form.elements.uri.value.trim();
    if (!uri) throw new Error("Enter a metadata URI.");
    return { target: "registry", functionName: "registerAsset", args: [assetId, uri], assetId, done: "Passport registered in Draft." };
  }
  if (kind === "publish") {
    return { target: "registry", functionName: "publishPassport", args: [assetId], assetId, done: "Passport published." };
  }
  if (kind === "status") {
    const status = Number(form.elements.status.value);
    return { target: "registry", functionName: "updateStatus", args: [assetId, status], assetId, done: `Status set to ${STATUSES[status]}.` };
  }
  const dataHash = await eventHash(form);
  if (!dataHash) throw new Error("Add a file, text or hash for this event.");
  const type = Number(form.elements.type.value);
  return { target: "eventLog", functionName: "addEvent", args: [assetId, type, dataHash], assetId, done: "Event added to the history." };
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
  let checkToken = 0;
  roleInput.addEventListener("input", async () => {
    const account = roleInput.value.trim();
    const token = ++checkToken;
    if (!isAddress(account)) {
      roleCheck.textContent = account ? "Enter a full 0x address." : "";
      return;
    }
    roleCheck.textContent = "Checking";
    try {
      const r = await readRoles(account);
      if (token === checkToken) roleCheck.textContent = r.issuer ? "Holds the issuer role." : "Has no issuer role.";
    } catch {
      if (token === checkToken) roleCheck.textContent = "";
    }
  });

  $$("[data-action]").forEach((form) =>
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!wallet.connected) return connectWallet();
      if (!wallet.onChain) return switchNetwork().catch((error) => toast(explainError(error)));

      const buttons = $$("button[type=submit]", form);
      let call;
      try {
        call = await buildCall(form);
      } catch (error) {
        return setStatus(form, esc(error.message), "error");
      }

      buttons.forEach((b) => (b.disabled = true));
      setStatus(form, "Confirm in your wallet.", "busy");
      try {
        const hash = await send({
          ...call,
          account: wallet.account,
          onSent: (sent) => setStatus(form, `Waiting for confirmation. ${txLink(sent)}`, "busy"),
        });
        setStatus(form, `${call.done} ${txLink(hash)}`, "ok");
        toast(call.done);
        if (form.dataset.action === "role") {
          rolesFor = "";
          refreshRoles();
          roleInput.dispatchEvent(new Event("input"));
        }
        if (call.assetId) {
          const input = $("[data-asset-input]");
          input.value = call.assetId;
          lookup(call.assetId);
        }
        if (form.dataset.action === "register") loadRecent();
      } catch (error) {
        setStatus(form, esc(explainError(error)), "error");
      } finally {
        buttons.forEach((b) => (b.disabled = !(wallet.connected && wallet.onChain)));
      }
    }),
  );
}

function renderContracts() {
  const chips = $("[data-contract-chips]");
  if (!CONTRACTS_READY) {
    chips.innerHTML = `<li>Contracts are not deployed yet.</li>`;
    $("[data-footer-network]").textContent = "Contracts not yet deployed.";
    return false;
  }
  chips.innerHTML = [
    ["Registry", REGISTRY],
    ["Event log", EVENT_LOG],
  ]
    .map(
      ([label, address]) =>
        `<li><span>${label}</span><a class="mono" href="${explorerLink("address", address)}" target="_blank" rel="noopener">${short(address)}</a></li>`,
    )
    .join("");
  $("[data-footer-network]").textContent = `Contracts live on ${ACTIVE_CHAIN.name}.`;
  return true;
}

if (renderContracts()) {
  initLookup();
  initRecent();
  initActions();
  initWalletUi();
} else {
  $("[data-wallet]").disabled = true;
  $$("[data-action] button[type=submit]").forEach((b) => (b.disabled = true));
}
