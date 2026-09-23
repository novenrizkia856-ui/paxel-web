// Passport domain helpers: asset ids, data hashes and action previews.
//
// No Paxel program is deployed on Solana, so there is no registry to read from and no instruction
// to send. Actions are validated and previewed only. Nothing is signed, sent or simulated as real.

export const STATUSES = ["Draft", "Issued", "Active", "Frozen", "Disputed", "Redeemed", "Delisted", "Defaulted"];
export const EVENT_TYPES = ["Transfer", "Document added", "Valuation reference", "Status change", "Corporate event"];

export const NOT_LIVE = "Onchain execution is not active yet.";

/** A 32 byte id written as 64 hex characters. */
export const isAssetId = (value) => /^[0-9a-f]{64}$/i.test(String(value ?? "").trim());

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (bytes) => hex(await crypto.subtle.digest("SHA-256", bytes));

/** A 64 character hex id is used as is. Any other text is hashed with SHA256. */
export async function toAssetId(input) {
  const value = String(input ?? "").trim();
  if (!value) return "";
  return isAssetId(value) ? value.toLowerCase() : sha256(new TextEncoder().encode(value));
}

export async function hashFile(file) {
  return sha256(await file.arrayBuffer());
}

export const hashText = (text) => sha256(new TextEncoder().encode(text));
