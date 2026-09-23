// Read only Solana client. @solana/web3.js loads on first use so the first paint stays light.
// Nothing here signs or sends: only public keys and balances are read.
import { SOLANA } from "../../../config/solana.config.js";

let web3Promise = null;
let connection = null;

const TIMEOUT_MS = 10000;

async function rpc() {
  web3Promise ??= import("@solana/web3.js");
  const web3 = await web3Promise;
  // Fail fast on a slow or rate limited RPC so the UI says unavailable instead of loading forever
  connection ??= new web3.Connection(SOLANA.rpcUrl, {
    commitment: "confirmed",
    disableRetryOnRateLimit: true,
    fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) }),
  });
  return { web3, connection };
}

/** Full check: base58 that decodes to 32 bytes. */
export async function isValidPublicKey(value) {
  const { web3 } = await rpc();
  try {
    new web3.PublicKey(String(value ?? "").trim());
    return true;
  } catch {
    return false;
  }
}

/** SOL balance of an account, in SOL. */
export async function readSolBalance(address) {
  const { web3, connection } = await rpc();
  const lamports = await connection.getBalance(new web3.PublicKey(address));
  return lamports / web3.LAMPORTS_PER_SOL;
}

const ASSOCIATED_TOKEN_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

/**
 * Balance an owner holds of one SPL mint, read from their associated token account.
 * Plain account reads only: free RPCs refuse the indexed getTokenAccountsByOwner.
 */
export async function readTokenBalance(owner, mint) {
  const { web3, connection } = await rpc();
  const mintKey = new web3.PublicKey(mint);
  const mintAccount = await connection.getAccountInfo(mintKey);
  if (!mintAccount) throw new Error("Mint not found");
  // SPL Token and Token 2022 mints both derive the associated account with the mint's own program
  const [ata] = web3.PublicKey.findProgramAddressSync(
    [new web3.PublicKey(owner).toBuffer(), mintAccount.owner.toBuffer(), mintKey.toBuffer()],
    new web3.PublicKey(ASSOCIATED_TOKEN_PROGRAM),
  );
  const { value } = await connection.getParsedAccountInfo(ata);
  return value?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
}
