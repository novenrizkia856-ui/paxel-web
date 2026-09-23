import { DEPLOY_COPY, SOLANA, explorerLink } from "../../config/solana.config.js";

const COPIED_MS = 1600;

function shorten(address) {
  return address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Permission denied or unfocused document. Use the legacy path below.
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("Copy failed");
}

// The hero note and footer say whether the Paxel program is live on Solana
function initDeployStatus() {
  const note = document.querySelector("[data-deploy-note]");
  if (note) note.textContent = DEPLOY_COPY.note;
  const legal = document.querySelector("[data-deploy-legal]");
  if (legal) legal.textContent = DEPLOY_COPY.legal;

  const link = document.querySelector("[data-deploy-link]");
  if (!link || !SOLANA.programId) return;
  link.href = explorerLink("address", SOLANA.programId);
  link.target = "_blank";
  link.rel = "noopener";
  link.removeAttribute("data-placeholder");
  const label = link.querySelector("[data-deploy-link-label]");
  if (label) label.textContent = "View the program";
}

export function initMintBar() {
  initDeployStatus();
  const bar = document.getElementById("mint-bar");
  if (!bar) return;

  const value = bar.querySelector("[data-ca-value]");
  const button = bar.querySelector("[data-ca-copy]");
  const label = bar.querySelector("[data-ca-copy-label]");
  const status = bar.querySelector("[data-ca-status]");
  const address = SOLANA.tokenMint;

  // Empty config keeps the "Coming soon" markup and a hidden, disabled copy button
  if (!address) {
    button.hidden = true;
    button.disabled = true;
    return;
  }

  const full = document.createElement("span");
  full.className = "ca-full";
  full.textContent = address;
  // The short form links to the mint on Solana Explorer
  const short = document.createElement("a");
  short.className = "ca-short";
  short.href = explorerLink("address", address);
  short.target = "_blank";
  short.rel = "noopener";
  short.tabIndex = -1;
  short.setAttribute("aria-hidden", "true");
  short.textContent = shorten(address);

  value.replaceChildren(full, short);
  value.title = address;
  bar.classList.add("is-live");
  button.hidden = false;
  button.disabled = false;

  let timer;
  button.addEventListener("click", async () => {
    try {
      await copyText(address);
      button.classList.add("is-copied");
      label.textContent = "Copied";
      status.textContent = "Mint address copied";
    } catch {
      // Last resort: select the mint address so it can be copied by hand
      window.getSelection()?.selectAllChildren(full);
      label.textContent = "Selected";
      status.textContent = "Mint address selected";
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      button.classList.remove("is-copied");
      label.textContent = "Copy";
      status.textContent = "";
    }, COPIED_MS);
  });
}
