# Solana Deployment

Paxel is built for **Solana**. The site and the app are configured for **{{networkLabel}}** (`{{network}}`).

## Status

| Item | Value |
|---|---|
| **Network** | {{networkLabel}} |
| **Paxel program** | {{programId}} |
| **Paxel token (SPL mint)** | {{tokenMint}} |
| **Treasury** | {{treasury}} |

{{programStatus}} The app connects Solana wallets and reads public data, but it never asks a wallet to sign and never sends a transaction. No passport, event or balance change is shown unless it is actually on chain.

## Planned Instructions

The first Paxel program follows the MVP scope: a passport registry, an append only event log and basic access control. The instructions below describe the plan and may change before deployment.

| Instruction | Signer | What it will do |
|---|---|---|
| `register_asset(asset_id, metadata_uri)` | Holder of the issuer role | Opens a passport account in Draft. The signer becomes its issuer. |
| `publish_passport(asset_id)` | The passport's issuer | Moves the passport from Draft to Issued. |
| `update_status(asset_id, status)` | The passport's issuer or an admin | Sets Active, Frozen, Disputed, Redeemed, Delisted or Defaulted. |
| `add_event(asset_id, event_type, data_hash)` | The passport's issuer | Appends an entry with type, data hash, submitter and timestamp. |

Passports and events will live in program derived accounts keyed by the asset id, so anyone can read them through any Solana RPC without a wallet. Event types are Transfer, Document added, Valuation reference, Status change and Corporate event. No instruction deletes or overwrites a passport or an event.

## Asset IDs

An asset reference typed as text is hashed with SHA256 into a 32 byte asset id, written as 64 hex characters. A 32 byte id fits a program derived address seed as is.

## Try It

The [Paxel app](/app) connects Phantom, Solflare, Backpack and other Solana wallets, shows your public key and SOL balance, and checks and previews every passport action. Until onchain execution is active, nothing is signed or sent.
