# API & SDK Concepts

Issuers and platforms are not expected to interact with the Solana program directly: they use an API/SDK layer that abstracts onchain and offchain writes into simple calls.

## Issuer Facing API (write access)

| Action | Purpose |
|---|---|
| `registerAsset()` | Open a new passport (Draft state) |
| `publishPassport()` | Move a passport from Draft to Issued |
| `addEvent()` | Append a lifecycle event (transfer, valuation reference, corporate event, etc.) |
| `attachDocument()` | Hash anchor a supporting document |
| `updateStatus()` | Change status (Active, Frozen, Disputed, Redeemed, etc.) |
| `delegateWriteAccess()` | Grant a platform limited write rights on the issuer's behalf |

## Verifier Facing API

| Action | Purpose |
|---|---|
| `submitAttestation()` | Publish a signed attestation against a specific passport fact |
| `resolveDispute()` | Record the outcome of a disputed claim |

## Read API (public, permissionless)

| Action | Purpose |
|---|---|
| `getPassport(assetId)` | Fetch current passport state |
| `getHistory(assetId)` | Fetch the full event timeline |
| `verifyDocument(hash)` | Confirm a document's hash is anchored, and where/when |
| `getAttestations(assetId)` | Fetch all attestations tied to a passport |

## SDK Concept

- Thin wrappers (e.g. JS/TS, Python) around the API that also handle:
  - Local hashing of documents before upload
  - Signing requests with the caller's Solana wallet
  - Subscribing to real time passport update events (webhooks or onchain event streams)
- Goal: an issuer or platform should be able to integrate Paxel in the time it takes to integrate any typical REST API, no direct program knowledge required.
