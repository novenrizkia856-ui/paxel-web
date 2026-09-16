import { CONTRACTS } from "../../config/contracts.config.js";

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

export function initContractBar() {
  const bar = document.getElementById("contract-bar");
  if (!bar) return;

  const value = bar.querySelector("[data-ca-value]");
  const button = bar.querySelector("[data-ca-copy]");
  const label = bar.querySelector("[data-ca-copy-label]");
  const status = bar.querySelector("[data-ca-status]");
  const address = String(CONTRACTS.tokenAddress ?? "").trim();

  // Empty config keeps the "Coming soon" markup and a hidden, disabled copy button
  if (!address) {
    button.hidden = true;
    button.disabled = true;
    return;
  }

  const full = document.createElement("span");
  full.className = "ca-full";
  full.textContent = address;
  const short = document.createElement("span");
  short.className = "ca-short";
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
      status.textContent = "Address copied";
    } catch {
      // Last resort: select the address so it can be copied by hand
      window.getSelection()?.selectAllChildren(full);
      label.textContent = "Selected";
      status.textContent = "Address selected";
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      button.classList.remove("is-copied");
      label.textContent = "Copy";
      status.textContent = "";
    }, COPIED_MS);
  });
}
