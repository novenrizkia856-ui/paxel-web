// Read and write client for PaxelRegistry and PaxelEventLog.
// Reads go straight to the public RPC, so they work without a wallet.
import {
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  createPublicClient,
  http,
  keccak256,
  toBytes,
  zeroHash,
} from "viem";
import { PAXEL_EVENT_LOG_ABI, PAXEL_REGISTRY_ABI } from "./abi.js";
import { ACTIVE_CHAIN, EVENT_LOG, REGISTRY } from "./chain.js";
import { writeContract } from "./wallet.js";

export const STATUSES = ["Draft", "Issued", "Active", "Frozen", "Disputed", "Redeemed", "Delisted", "Defaulted"];
export const EVENT_TYPES = ["Transfer", "Document added", "Valuation reference", "Status change", "Corporate event"];

export const ADMIN_ROLE = zeroHash;
export const ISSUER_ROLE = keccak256(toBytes("ISSUER_ROLE"));

const client = ACTIVE_CHAIN
  ? createPublicClient({
      chain: {
        id: ACTIVE_CHAIN.id,
        name: ACTIVE_CHAIN.name,
        nativeCurrency: ACTIVE_CHAIN.nativeCurrency,
        rpcUrls: { default: { http: [ACTIVE_CHAIN.rpcUrl] } },
      },
      transport: http(ACTIVE_CHAIN.rpcUrl, { batch: true, retryCount: 2 }),
    })
  : null;

const registry = { address: REGISTRY, abi: PAXEL_REGISTRY_ABI };
const eventLog = { address: EVENT_LOG, abi: PAXEL_EVENT_LOG_ABI };

export const isBytes32 = (value) => /^0x[0-9a-fA-F]{64}$/.test(value);
export const isAddress = (value) => /^0x[0-9a-fA-F]{40}$/.test(value);

/** A 0x prefixed 32 byte id is used as is. Any other text is hashed with keccak256. */
export function toAssetId(input) {
  const value = String(input ?? "").trim();
  if (!value) return "";
  return isBytes32(value) ? value.toLowerCase() : keccak256(toBytes(value));
}

/** Returns the passport, or null when the id was never registered. */
export async function readPassport(assetId) {
  const [issuer, status, metadataURI, tokenizedAt] = await client.readContract({
    ...registry,
    functionName: "passports",
    args: [assetId],
  });
  if (/^0x0{40}$/i.test(issuer)) return null;
  return { assetId, issuer, status: Number(status), metadataURI, tokenizedAt: Number(tokenizedAt) };
}

export async function readHistory(assetId) {
  const entries = await client.readContract({ ...eventLog, functionName: "getHistory", args: [assetId] });
  return entries.map((e) => ({
    eventType: Number(e.eventType),
    dataHash: e.dataHash,
    submittedBy: e.submittedBy,
    timestamp: Number(e.timestamp),
  }));
}

export async function readRoles(account) {
  const [admin, issuer] = await Promise.all([
    client.readContract({ ...registry, functionName: "hasRole", args: [ADMIN_ROLE, account] }),
    client.readContract({ ...registry, functionName: "hasRole", args: [ISSUER_ROLE, account] }),
  ]);
  return { admin, issuer };
}

/** Most recent AssetRegistered events, newest first. Scans backwards in chunks. */
export async function readRecentPassports(limit = 8) {
  const latest = await client.getBlockNumber();
  const floor = ACTIVE_CHAIN.registryFromBlock;
  const found = [];
  let span = 500000n;
  let to = latest;
  while (to >= floor && found.length < limit) {
    const from = to - span + 1n > floor ? to - span + 1n : floor;
    try {
      const logs = await client.getContractEvents({ ...registry, eventName: "AssetRegistered", fromBlock: from, toBlock: to });
      found.push(...logs.reverse());
      to = from - 1n;
    } catch (error) {
      // Some RPCs cap the block range. Halve it and try again.
      if (span <= 5000n) throw error;
      span /= 2n;
    }
  }
  const latestStatus = await Promise.all(
    found.slice(0, limit).map((log) => readPassport(log.args.assetId).catch(() => null)),
  );
  return found.slice(0, limit).map((log, i) => ({
    assetId: log.args.assetId,
    issuer: log.args.issuer,
    metadataURI: log.args.metadataURI,
    tokenizedAt: Number(log.args.tokenizedAt),
    status: latestStatus[i]?.status ?? 0,
  }));
}

export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  return keccak256(new Uint8Array(buffer));
}

export const hashText = (text) => keccak256(toBytes(text));

const ERROR_COPY = {
  AccessControlUnauthorizedAccount: "This wallet does not hold the issuer role.",
  NotIssuer: "Only the issuer of this passport can do that.",
  NotIssuerOrAdmin: "Only the issuer or an admin can change this status.",
  AssetAlreadyRegistered: "A passport with this asset id already exists.",
  AssetNotFound: "No passport exists for this asset id.",
  NotDraft: "This passport is already published.",
  NotPublished: "Publish the passport before changing its status.",
  InvalidStatus: "A passport cannot return to Draft.",
  ZeroAssetId: "Enter an asset reference or id.",
  EmptyMetadataURI: "Enter a metadata URI.",
  ZeroDataHash: "Add a file, text or hash for this event.",
  ZeroAddress: "Enter a valid wallet address.",
};

export function explainError(error) {
  const reverted = error?.walk?.((e) => e instanceof ContractFunctionRevertedError);
  const name = reverted?.data?.errorName;
  if (name === "AccessControlUnauthorizedAccount" && reverted.data.args?.[1] === ADMIN_ROLE) {
    return "Only the registry admin can do that.";
  }
  if (name && ERROR_COPY[name]) return ERROR_COPY[name];
  if (error?.walk?.((e) => e instanceof UserRejectedRequestError) || /reject|denied/i.test(error?.message ?? "")) {
    return "Request declined in your wallet.";
  }
  if (/insufficient funds/i.test(error?.message ?? "")) return "This wallet needs a little ETH for gas.";
  return error?.shortMessage || "Something went wrong. Please try again.";
}

const TARGETS = { registry, eventLog };

/**
 * Simulates the call first so a revert is explained before the wallet opens,
 * then sends it and waits for the receipt.
 */
export async function send({ target, functionName, args, account, onSent }) {
  const request = { ...TARGETS[target], functionName, args };
  await client.simulateContract({ ...request, account });
  const hash = await writeContract(request);
  onSent?.(hash);
  const receipt = await client.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("The transaction reverted.");
  return hash;
}
