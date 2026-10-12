# Smart Contract Design (Conceptual)

This section describes contract level **responsibilities**, not code. It's meant to guide implementation, not replace it.

## Core Contracts

### 1. Passport Registry
- Source of truth for: does a given asset ID have a passport, who is its issuer, what is its current status, and a pointer to its metadata.
- Minimal onchain state: this contract is optimized to answer "does this exist and what's its current state," not to store history.

### 2. Event / History Log
- Append only. Every lifecycle event (transfer, valuation reference, document added, status change, corporate/asset event) is written here as a discrete, timestamped, signed entry.
- Designed so the full history of a passport can always be reconstructed by reading this log in order.

### 3. Access Control
- Role based: `ISSUER_ROLE`, `VERIFIER_ROLE`, `ADMIN_ROLE`, and optionally `DELEGATE_ROLE` for platforms writing on an issuer's behalf.
- Determines *who may call which functions* on the Registry and Event Log: it does not itself store passport content.

### 4. Attestation Registry
- Where verifiers publish signed attestations that reference a specific passport, a specific event/fact, and their own verifier identity.
- Kept as a separate contract so verification can be added *after* a passport exists, without needing to modify the passport itself.

## Optional: Passport Identity Token

A non transferable ("soulbound style") token can represent the *passport itself*, separate from the underlying RWA token. This gives the passport its own permanent onchain address, which:

- Lets other contracts/protocols reference "this passport" directly, independent of which RWA token contract is currently wrapping the asset.
- Survives even if the underlying token is reminted, rewrapped, or bridged.

## Key Design Tensions to Resolve During Implementation

- **Permanence vs. upgradability**: the registry's data must outlive contract upgrades. A common pattern is an immutable "pointer" contract in front of upgradable logic, so external references never break.
- **Gas cost vs. completeness**: every field stored onchain costs gas forever; the schema in [Data Model](data-model.md) already reflects a hash and pointer approach to keep this manageable.
- **Cross chain reach**: if a passport needs to be referenced from a chain other than its home chain, this requires either a bridging/attestation mechanism or a read only mirror; this document intentionally leaves that as a Phase 2 decision (see [MVP Scope](mvp-scope.md)).
